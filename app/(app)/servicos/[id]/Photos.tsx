'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { ServicePhoto } from '@/lib/types'

const MAX_PHOTOS = 5
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const TARGET_MAX_DIMENSION = 1920
const ACCEPT = 'image/jpeg,image/png,image/heic,image/heif'

interface PhotosProps {
  servicoId: string
  userId: string
  initialPhotos: ServicePhoto[]
  readonly?: boolean
}

export function Photos({ servicoId, userId, initialPhotos, readonly = false }: PhotosProps) {
  const supabase = createBrowserClient()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [photos, setPhotos] = useState<ServicePhoto[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remaining = MAX_PHOTOS - photos.length

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = '' // reset para permitir mesmo arquivo de novo
    if (!files.length) return

    if (files.length > remaining) {
      setError(`Máximo de ${MAX_PHOTOS} fotos. Você pode adicionar mais ${remaining}.`)
      return
    }

    setError(null)
    setUploading(true)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const compressed = await compressImage(file)
        if (compressed.size > MAX_SIZE_BYTES) {
          throw new Error(`"${file.name}" excede 5MB mesmo após compressão.`)
        }

        const ext = compressed.type === 'image/jpeg' ? 'jpg' : compressed.type.split('/')[1] || 'jpg'
        const path = `${userId}/${servicoId}/${Date.now()}-${i}.${ext}`

        const { error: upErr } = await supabase.storage
          .from('service-photos')
          .upload(path, compressed, { contentType: compressed.type, upsert: false })
        if (upErr) throw upErr

        const { data: pub } = supabase.storage.from('service-photos').getPublicUrl(path)

        const ordem = photos.length + i
        const { data: row, error: insErr } = await supabase
          .from('service_photos')
          .insert({
            servico_id: servicoId,
            user_id: userId,
            storage_path: path,
            public_url: pub.publicUrl,
            mime_type: compressed.type,
            size_bytes: compressed.size,
            ordem,
          })
          .select()
          .single()
        if (insErr) throw insErr

        setPhotos((curr) => [...curr, row as ServicePhoto])
      }

      startTransition(() => router.refresh())
    } catch (err: any) {
      setError(err.message ?? 'Erro no upload')
    } finally {
      setUploading(false)
    }
  }

  async function handleRemove(photo: ServicePhoto) {
    if (readonly) return
    if (!confirm('Remover esta foto?')) return
    setError(null)
    try {
      await supabase.storage.from('service-photos').remove([photo.storage_path])
      const { error: delErr } = await supabase.from('service_photos').delete().eq('id', photo.id)
      if (delErr) throw delErr
      setPhotos((curr) => curr.filter((p) => p.id !== photo.id))
      startTransition(() => router.refresh())
    } catch (err: any) {
      setError(err.message ?? 'Erro ao remover')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-vobi-dark">Fotos do equipamento</h3>
          <p className="text-xs text-vobi-gray">Até {MAX_PHOTOS} fotos · JPG, PNG ou HEIC · 5MB máx.</p>
        </div>
        <span className="text-xs text-vobi-gray-light font-medium">{photos.length}/{MAX_PHOTOS}</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {photos.map((photo) => (
          <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border border-vobi-border group bg-vobi-cream">
            <Image
              src={photo.public_url}
              alt="Foto do serviço"
              fill
              sizes="(max-width: 640px) 33vw, 20vw"
              className="object-cover"
              unoptimized
            />
            {!readonly && (
              <button
                type="button"
                onClick={() => handleRemove(photo)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remover"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {!readonly && remaining > 0 && (
          <label
            className={cn(
              'relative aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors',
              uploading ? 'border-vobi-primary bg-vobi-primary-light' : 'border-vobi-border hover:border-vobi-primary hover:bg-vobi-primary-light'
            )}
          >
            <input
              type="file"
              accept={ACCEPT}
              multiple
              className="hidden"
              onChange={handleFiles}
              disabled={uploading}
            />
            {uploading ? (
              <svg className="w-5 h-5 animate-spin text-vobi-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75 fill-current" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                <svg className="w-6 h-6 text-vobi-gray-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                <span className="text-[10px] text-vobi-gray font-medium">Adicionar</span>
              </>
            )}
          </label>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  )
}

async function compressImage(file: File): Promise<Blob> {
  // HEIC/HEIF raramente decodifica no canvas — se o tipo for HEIC, só valida tamanho
  if (/heic|heif/i.test(file.type) || /\.heic$|\.heif$/i.test(file.name)) {
    if (file.size <= MAX_SIZE_BYTES) return file
    throw new Error('Foto HEIC excede 5MB — reduza no celular antes de enviar.')
  }

  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Falha ao ler imagem'))
    reader.onload = () => {
      const img = new window.Image()
      img.onerror = () => reject(new Error('Formato de imagem inválido'))
      img.onload = () => {
        const scale = Math.min(1, TARGET_MAX_DIMENSION / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas indisponível'))
        ctx.drawImage(img, 0, 0, w, h)

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Falha ao comprimir'))
            resolve(blob)
          },
          'image/jpeg',
          0.82
        )
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
