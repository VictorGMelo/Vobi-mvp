'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface FinalizeButtonProps {
  servicoId: string
  disabled: boolean
  disabledReason?: string
}

export function FinalizeButton({ servicoId, disabled, disabledReason }: FinalizeButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFinalize() {
    if (disabled || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/servicos/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicoId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao finalizar')
      router.push(`/servicos/${servicoId}/resumo`)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={handleFinalize} disabled={disabled} loading={loading} title={disabled ? disabledReason : undefined}>
        Finalizar serviço
      </Button>
      {disabled && disabledReason && (
        <p className="text-[11px] text-vobi-gray-light text-right max-w-[220px]">{disabledReason}</p>
      )}
      {error && (
        <p className="text-[11px] text-red-600 text-right max-w-[220px]">{error}</p>
      )}
    </div>
  )
}
