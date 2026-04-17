'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface DiagnoseButtonProps {
  servicoId: string
  progressPct: number
  initialDiagnostico: string | null
  readonly?: boolean
}

export function DiagnoseButton({ servicoId, progressPct, initialDiagnostico, readonly }: DiagnoseButtonProps) {
  const router = useRouter()
  const [diagnostico, setDiagnostico] = useState<string | null>(initialDiagnostico)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canRun = progressPct >= 50

  async function run() {
    setLoading(true)
    setError(null)
    try {
      const controller = new AbortController()
      const t = setTimeout(() => controller.abort(), 10_000) // 10s SLA
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicoId }),
        signal: controller.signal,
      })
      clearTimeout(t)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao gerar diagnóstico')
      setDiagnostico(data.diagnostico)
      router.refresh()
    } catch (e: any) {
      if (e.name === 'AbortError') setError('A IA demorou mais de 10 segundos. Tente novamente.')
      else setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (readonly && !diagnostico) return null

  return (
    <Card className="p-4 mb-4 border-dashed">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-vobi-primary-light flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-vobi-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h3 className="text-sm font-semibold text-vobi-dark">Sugestão de diagnóstico</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
              Sugestão gerada por IA — revise antes de usar
            </span>
          </div>

          {diagnostico ? (
            <p className="text-sm text-vobi-dark leading-relaxed whitespace-pre-wrap mt-1">{diagnostico}</p>
          ) : (
            <p className="text-xs text-vobi-gray">
              {canRun
                ? 'Gere uma sugestão técnica com base no que você marcou até agora.'
                : `Disponível após marcar pelo menos 50% dos itens (atual: ${progressPct}%).`}
            </p>
          )}

          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

          {!readonly && (
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={run} disabled={!canRun} loading={loading}>
                {diagnostico ? 'Gerar novamente' : 'Sugerir diagnóstico'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
