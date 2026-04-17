'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { ChecklistItemRow, ChecklistItemStatus } from '@/lib/types'

const statusConfig: Record<ChecklistItemStatus, { label: string; dot: string; btn: string; active: string }> = {
  pendente: {
    label: 'Pendente',
    dot: 'bg-vobi-gray/30',
    btn: '',
    active: '',
  },
  ok: {
    label: 'OK',
    dot: 'bg-green-500',
    btn: 'border-vobi-border text-vobi-gray-light hover:border-green-300 hover:text-green-700',
    active: 'bg-green-50 text-green-700 border-green-300',
  },
  ajustado: {
    label: 'Ajustado',
    dot: 'bg-amber-500',
    btn: 'border-vobi-border text-vobi-gray-light hover:border-amber-300 hover:text-amber-700',
    active: 'bg-amber-50 text-amber-700 border-amber-300',
  },
  problema: {
    label: 'Problema',
    dot: 'bg-red-500',
    btn: 'border-vobi-border text-vobi-gray-light hover:border-red-300 hover:text-red-700',
    active: 'bg-red-50 text-red-700 border-red-300',
  },
}

const actionButtons: { value: Exclude<ChecklistItemStatus, 'pendente'>; label: string }[] = [
  { value: 'ok', label: 'OK' },
  { value: 'ajustado', label: 'Ajustado' },
  { value: 'problema', label: 'Problema' },
]

interface ChecklistItemProps {
  item: ChecklistItemRow
  readonly?: boolean
}

export function ChecklistItem({ item, readonly = false }: ChecklistItemProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<ChecklistItemStatus>(item.status)
  const [observacao, setObservacao] = useState(item.observacao ?? '')
  const [numericValue, setNumericValue] = useState<string>(
    item.numeric_value !== null && item.numeric_value !== undefined ? String(item.numeric_value) : ''
  )
  const [saving, setSaving] = useState(false)
  const [obsError, setObsError] = useState<string | null>(null)

  const isProblema = status === 'problema'
  const obsMissing = isProblema && !observacao.trim()

  async function update(payload: Record<string, any>) {
    setSaving(true)
    const res = await fetch('/api/checklist/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, ...payload }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Erro ao salvar')
    }
    startTransition(() => router.refresh())
  }

  async function handleStatusClick(newStatus: Exclude<ChecklistItemStatus, 'pendente'>) {
    if (readonly) return
    // Entrando em "problema" sem observação: pedir obs antes
    if (newStatus === 'problema' && !observacao.trim()) {
      setStatus(newStatus)
      setObsError('Descreva o problema encontrado para salvar.')
      return
    }
    setObsError(null)
    setStatus(newStatus)
    try {
      await update({ status: newStatus })
    } catch (e: any) {
      setObsError(e.message)
    }
  }

  async function handleSaveObservacao() {
    if (isProblema && !observacao.trim()) {
      setObsError('Observação obrigatória para itens com problema.')
      return
    }
    setObsError(null)
    try {
      await update({ status, observacao: observacao.trim() || null })
    } catch (e: any) {
      setObsError(e.message)
    }
  }

  async function handleSaveNumeric() {
    const num = numericValue.trim() === '' ? null : Number(numericValue)
    if (num !== null && !Number.isFinite(num)) {
      setObsError('Valor numérico inválido')
      return
    }
    try {
      await update({ numeric_value: num })
    } catch (e: any) {
      setObsError(e.message)
    }
  }

  const cfg = statusConfig[status]

  return (
    <li className={cn('px-4 py-3.5 transition-opacity', (isPending || saving) && 'opacity-60')}>
      <div className="flex items-start gap-3">
        <div className={cn('mt-1.5 w-2 h-2 rounded-full shrink-0 transition-colors', cfg.dot)} />

        <div className="flex-1 min-w-0">
          <p className="text-sm text-vobi-dark font-medium leading-snug">{item.descricao}</p>
          {item.orientacao && (
            <p className="text-xs text-vobi-gray mt-0.5 leading-snug">{item.orientacao}</p>
          )}

          {/* Campo numérico (°C, psi) */}
          {item.kind === 'numeric' && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={numericValue}
                onChange={(e) => setNumericValue(e.target.value)}
                onBlur={!readonly ? handleSaveNumeric : undefined}
                readOnly={readonly}
                placeholder="—"
                className="w-24 text-xs px-2.5 py-1.5 rounded-lg border border-vobi-border focus:outline-none focus:ring-2 focus:ring-vobi-primary/20 focus:border-vobi-primary transition-colors"
              />
              {item.unit && <span className="text-xs text-vobi-gray">{item.unit}</span>}
            </div>
          )}

          {/* Observação */}
          {!readonly && (
            <div className="mt-2">
              <textarea
                value={observacao}
                onChange={(e) => { setObservacao(e.target.value); setObsError(null) }}
                onBlur={handleSaveObservacao}
                rows={2}
                placeholder={isProblema ? 'Descreva o problema (obrigatório)' : 'Observação (opcional)'}
                className={cn(
                  'w-full text-xs px-2.5 py-1.5 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-vobi-primary/20 focus:border-vobi-primary resize-none transition-colors',
                  obsMissing ? 'border-red-300' : 'border-vobi-border'
                )}
              />
              {obsError && <p className="text-[11px] text-red-600 mt-1">{obsError}</p>}
            </div>
          )}

          {readonly && observacao && (
            <p className="text-xs text-vobi-gray mt-1 italic">"{observacao}"</p>
          )}
        </div>

        {/* Botões de status */}
        {readonly ? (
          <span
            className={cn(
              'text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0',
              status === 'pendente' && 'bg-vobi-cream text-vobi-gray border-vobi-border',
              status !== 'pendente' && cfg.active
            )}
          >
            {cfg.label}
          </span>
        ) : (
          <div className="flex flex-wrap items-center gap-1 shrink-0 max-w-[180px] justify-end">
            {actionButtons.map(({ value, label }) => {
              const active = status === value
              return (
                <button
                  type="button"
                  key={value}
                  onClick={() => handleStatusClick(value)}
                  className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full border transition-all font-semibold',
                    active ? statusConfig[value].active : statusConfig[value].btn
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </li>
  )
}
