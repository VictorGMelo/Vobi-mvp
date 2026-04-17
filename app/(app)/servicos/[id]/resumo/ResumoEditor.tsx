'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface ResumoEditorProps {
  servicoId: string
  initialResumo: string | null
}

export function ResumoEditor({ servicoId, initialResumo }: ResumoEditorProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialResumo ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setValue(initialResumo ?? '')
  }, [initialResumo])

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      const el = textareaRef.current
      el.setSelectionRange(el.value.length, el.value.length)
    }
  }, [editing])

  function startEdit() {
    setValue(initialResumo ?? '')
    setError(null)
    setEditing(true)
  }

  function cancel() {
    setValue(initialResumo ?? '')
    setError(null)
    setEditing(false)
  }

  async function save() {
    const trimmed = value.trim()
    if (!trimmed) {
      setError('O resumo não pode ficar vazio.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/servicos/update-resumo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicoId, resumo: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar')
      setEditing(false)
      startTransition(() => router.refresh())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={8}
          maxLength={5000}
          disabled={saving}
          className="w-full px-3 py-2 text-sm rounded-lg border border-vobi-border bg-white text-vobi-dark leading-relaxed focus:outline-none focus:ring-2 focus:ring-vobi-primary/20 focus:border-vobi-primary resize-y"
        />
        <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
          <span className="text-xs text-vobi-gray">{value.length}/5000</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={cancel} disabled={saving}>
              Cancelar
            </Button>
            <Button size="sm" onClick={save} loading={saving}>
              Salvar
            </Button>
          </div>
        </div>
        {error && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div>
      {initialResumo ? (
        <p className="text-sm text-vobi-dark leading-relaxed whitespace-pre-wrap">{initialResumo}</p>
      ) : (
        <p className="text-sm text-vobi-gray">Resumo ainda não gerado.</p>
      )}
      <div className="flex justify-end mt-3">
        <Button variant="secondary" size="sm" onClick={startEdit} disabled={!initialResumo}>
          Editar
        </Button>
      </div>
    </div>
  )
}
