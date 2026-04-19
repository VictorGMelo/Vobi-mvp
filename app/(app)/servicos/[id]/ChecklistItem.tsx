'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { ChecklistItemRow, ChecklistItemStatus } from '@/lib/types'

const statusConfig: Record<ChecklistItemStatus, { label: string; dot: string; btn: string; active: string; readonlyBadge: string }> = {
  pendente: {
    label: 'Pendente',
    dot: 'bg-vobi-gray/30',
    btn: '',
    active: '',
    readonlyBadge: 'bg-vobi-cream text-vobi-gray border-vobi-border',
  },
  ok: {
    label: 'OK',
    dot: 'bg-green-500',
    btn: 'bg-white border-vobi-border text-vobi-gray hover:border-green-400 hover:text-green-700 hover:bg-green-50',
    active: 'bg-green-600 border-green-600 text-white shadow-sm hover:bg-green-700',
    readonlyBadge: 'bg-green-50 text-green-700 border-green-200',
  },
  ajustado: {
    label: 'Ajustado',
    dot: 'bg-amber-500',
    btn: 'bg-white border-vobi-border text-vobi-gray hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50',
    active: 'bg-amber-500 border-amber-500 text-white shadow-sm hover:bg-amber-600',
    readonlyBadge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  problema: {
    label: 'Problema',
    dot: 'bg-red-500',
    btn: 'bg-white border-vobi-border text-vobi-gray hover:border-red-400 hover:text-red-700 hover:bg-red-50',
    active: 'bg-red-600 border-red-600 text-white shadow-sm hover:bg-red-700',
    readonlyBadge: 'bg-red-50 text-red-700 border-red-200',
  },
}

const OkIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)
const AjustadoIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437" />
  </svg>
)
const ProblemaIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
  </svg>
)

const actionButtons: { value: Exclude<ChecklistItemStatus, 'pendente'>; label: string; Icon: () => JSX.Element }[] = [
  { value: 'ok', label: 'OK', Icon: OkIcon },
  { value: 'ajustado', label: 'Ajustado', Icon: AjustadoIcon },
  { value: 'problema', label: 'Problema', Icon: ProblemaIcon },
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
    <li className={cn('px-4 py-4 transition-opacity', (isPending || saving) && 'opacity-60')}>
      <div className="flex items-start gap-3">
        <div className={cn('mt-1.5 w-2 h-2 rounded-full shrink-0 transition-colors', cfg.dot)} />

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-vobi-dark font-medium leading-snug">{item.descricao}</p>
              {item.orientacao && (
                <p className="text-xs text-vobi-gray mt-0.5 leading-snug">{item.orientacao}</p>
              )}
            </div>

            {readonly && (
              <span
                className={cn(
                  'text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0',
                  cfg.readonlyBadge
                )}
              >
                {cfg.label}
              </span>
            )}
          </div>

          {/* Campo numérico (°C, psi) */}
          {item.kind === 'numeric' && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={numericValue}
                onChange={(e) => setNumericValue(e.target.value)}
                onBlur={!readonly ? handleSaveNumeric : undefined}
                readOnly={readonly}
                placeholder="—"
                className="w-24 text-sm px-2.5 py-1.5 rounded-lg border border-vobi-border focus:outline-none focus:ring-2 focus:ring-vobi-primary/20 focus:border-vobi-primary transition-colors"
              />
              {item.unit && <span className="text-xs text-vobi-gray">{item.unit}</span>}
            </div>
          )}

          {/* Botões de status (mobile-first: grid de 3; sm+: inline à direita) */}
          {!readonly && (
            <div className="grid grid-cols-3 gap-2 sm:flex sm:justify-end sm:gap-2">
              {actionButtons.map(({ value, label, Icon }) => {
                const active = status === value
                return (
                  <button
                    type="button"
                    key={value}
                    onClick={() => handleStatusClick(value)}
                    aria-pressed={active}
                    className={cn(
                      'inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 rounded-lg border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-vobi-primary/30',
                      active ? statusConfig[value].active : statusConfig[value].btn
                    )}
                  >
                    <Icon />
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Observação */}
          {!readonly && (
            <div>
              <textarea
                value={observacao}
                onChange={(e) => { setObservacao(e.target.value); setObsError(null) }}
                onBlur={handleSaveObservacao}
                rows={2}
                placeholder={isProblema ? 'Descreva o problema (obrigatório)' : 'Observação (opcional)'}
                className={cn(
                  'w-full text-sm px-3 py-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-vobi-primary/20 focus:border-vobi-primary resize-none transition-colors',
                  obsMissing ? 'border-red-300' : 'border-vobi-border'
                )}
              />
              {obsError && <p className="text-[11px] text-red-600 mt-1">{obsError}</p>}
            </div>
          )}

          {readonly && observacao && (
            <p className="text-xs text-vobi-gray italic">"{observacao}"</p>
          )}
        </div>
      </div>
    </li>
  )
}
