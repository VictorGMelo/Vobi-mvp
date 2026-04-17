'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { StatusFinal } from '@/lib/types'

const OPTIONS: { value: StatusFinal; label: string; hint: string }[] = [
  { value: 'ok', label: 'OK', hint: 'Nenhum problema identificado; equipamento operando bem.' },
  { value: 'ajuste_realizado', label: 'Ajuste Realizado', hint: 'Problemas encontrados foram corrigidos na visita.' },
  { value: 'retorno_necessario', label: 'Retorno Necessário', hint: 'Problemas identificados que exigem nova visita ou peça.' },
]

interface FinalizeDialogProps {
  servicoId: string
  disabled: boolean
  disabledReason?: string
  pendentes: number
  problemasSemObs: number
}

export function FinalizeDialog({ servicoId, disabled, disabledReason, pendentes, problemasSemObs }: FinalizeDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState<StatusFinal | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    if (!choice) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/servicos/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicoId, statusFinal: choice }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao finalizar')
      setOpen(false)
      router.push(`/servicos/${servicoId}/resumo`)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <Button onClick={() => setOpen(true)} disabled={disabled} title={disabled ? disabledReason : undefined}>
          Finalizar serviço
        </Button>
        {disabled && disabledReason && (
          <p className="text-[11px] text-vobi-gray-light text-right">{disabledReason}</p>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-vobi-dark mb-1">Finalizar visita</h2>
            <p className="text-sm text-vobi-gray mb-4">Escolha o status final. Após confirmar, o serviço fica somente leitura e o e-mail é enviado ao cliente.</p>

            {(pendentes > 0 || problemasSemObs > 0) && (
              <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-3">
                {pendentes > 0 && <div>• {pendentes} item(ns) ainda pendente(s) no checklist.</div>}
                {problemasSemObs > 0 && <div>• {problemasSemObs} item(ns) com "Problema" sem observação.</div>}
              </div>
            )}

            <div className="space-y-2 mb-5">
              {OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setChoice(opt.value)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl border transition-colors',
                    choice === opt.value
                      ? 'border-vobi-primary bg-vobi-primary-light'
                      : 'border-vobi-border hover:border-vobi-gray-light'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                      choice === opt.value ? 'border-vobi-primary' : 'border-vobi-gray-light'
                    )}>
                      {choice === opt.value && <span className="w-2 h-2 bg-vobi-primary rounded-full" />}
                    </span>
                    <span className="font-semibold text-sm text-vobi-dark">{opt.label}</span>
                  </div>
                  <p className="text-xs text-vobi-gray mt-1 pl-6">{opt.hint}</p>
                </button>
              ))}
            </div>

            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleConfirm} disabled={!choice} loading={loading}>
                Confirmar finalização
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
