'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { STATUS_FINAL_LABEL, type Servico } from '@/lib/types'

const VIEW_KEY = 'vobi:servicos:view'
const PAGE_SIZE_KEY = 'vobi:servicos:pageSize'
const PAGE_SIZES = [10, 25, 50, 100]

type View = 'cards' | 'list'
type StatusFilter = 'todos' | 'em_andamento' | 'ok' | 'ajuste_realizado' | 'retorno_necessario'

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'ok', label: 'OK' },
  { value: 'ajuste_realizado', label: 'Ajuste Realizado' },
  { value: 'retorno_necessario', label: 'Retorno Necessário' },
]

function normalize(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function matchesStatus(servico: Servico, filter: StatusFilter) {
  if (filter === 'todos') return true
  if (filter === 'em_andamento') return servico.status === 'em_andamento'
  return servico.status === 'finalizado' && servico.status_final === filter
}

function getStatusBadge(servico: Servico) {
  const finalized = servico.status === 'finalizado'
  const variant: 'success' | 'warning' | 'danger' =
    !finalized || !servico.status_final ? 'warning'
      : servico.status_final === 'ok' ? 'success'
      : servico.status_final === 'ajuste_realizado' ? 'warning'
      : 'danger'
  const label = finalized && servico.status_final ? STATUS_FINAL_LABEL[servico.status_final] : 'Em andamento'
  return { variant, label }
}

export function ServicosView({ servicos }: { servicos: Servico[] }) {
  const [view, setView] = useState<View>('cards')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [mounted, setMounted] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')

  useEffect(() => {
    try {
      const storedView = window.localStorage.getItem(VIEW_KEY)
      if (storedView === 'cards' || storedView === 'list') setView(storedView)
      const storedSize = Number(window.localStorage.getItem(PAGE_SIZE_KEY))
      if (PAGE_SIZES.includes(storedSize)) setPageSize(storedSize)
    } catch {}
    setMounted(true)
  }, [])

  function changeView(next: View) {
    setView(next)
    try { window.localStorage.setItem(VIEW_KEY, next) } catch {}
  }

  function changePageSize(n: number) {
    setPageSize(n)
    setPage(1)
    try { window.localStorage.setItem(PAGE_SIZE_KEY, String(n)) } catch {}
  }

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    return servicos.filter((s) => {
      if (!matchesStatus(s, statusFilter)) return false
      if (!q) return true
      return normalize(s.cliente_nome).includes(q)
    })
  }, [servicos, query, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [query, statusFilter])

  const emAndamento = useMemo(() => filtered.filter((s) => s.status === 'em_andamento'), [filtered])
  const finalizados = useMemo(() => filtered.filter((s) => s.status === 'finalizado'), [filtered])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIdx = (currentPage - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)
  const paginated = filtered.slice(startIdx, endIdx)

  const hasFilters = query.trim() !== '' || statusFilter !== 'todos'
  const noResults = mounted && filtered.length === 0

  return (
    <>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-vobi-gray-light pointer-events-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0011.454 11.454z" />
            </svg>
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por cliente"
            className="w-full pl-9 pr-9 py-2 text-sm rounded-lg bg-white border border-vobi-border text-vobi-dark placeholder:text-vobi-gray-light focus:outline-none focus:ring-2 focus:ring-vobi-primary/20 focus:border-vobi-primary transition-colors"
            aria-label="Buscar por cliente"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-vobi-gray-light hover:text-vobi-dark transition-colors p-1"
              aria-label="Limpar busca"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2 text-sm rounded-lg bg-white border border-vobi-border text-vobi-dark focus:outline-none focus:ring-2 focus:ring-vobi-primary/20 focus:border-vobi-primary transition-colors"
          aria-label="Filtrar por status"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <div className="inline-flex rounded-lg border border-vobi-border bg-white p-0.5 ml-auto" role="tablist" aria-label="Modo de visualização">
          <button
            type="button"
            onClick={() => changeView('cards')}
            aria-pressed={view === 'cards'}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors',
              view === 'cards' ? 'bg-vobi-primary-light text-vobi-primary' : 'text-vobi-gray hover:text-vobi-dark'
            )}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Cards
          </button>
          <button
            type="button"
            onClick={() => changeView('list')}
            aria-pressed={view === 'list'}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors',
              view === 'list' ? 'bg-vobi-primary-light text-vobi-primary' : 'text-vobi-gray hover:text-vobi-dark'
            )}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
            Lista
          </button>
        </div>
      </div>

      {!mounted ? null : view === 'cards' ? (
        <>
          {noResults && (
            <Card className="p-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-vobi-cream rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-vobi-gray-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0011.454 11.454z" />
                </svg>
              </div>
              <h3 className="text-vobi-dark font-semibold mb-1">Nenhum serviço encontrado</h3>
              <p className="text-vobi-gray text-sm mb-4">
                {hasFilters ? 'Ajuste a busca ou o filtro para ver mais resultados.' : 'Nenhum registro disponível.'}
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setStatusFilter('todos') }}
                  className="text-vobi-primary font-semibold text-sm hover:underline"
                >
                  Limpar filtros
                </button>
              )}
            </Card>
          )}

          {emAndamento.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xs font-semibold text-vobi-gray uppercase tracking-wider mb-3">Em andamento</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {emAndamento.map((s) => <ServicoCard key={s.id} servico={s} />)}
              </div>
            </section>
          )}

          {finalizados.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-vobi-gray uppercase tracking-wider mb-3">Finalizados</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {finalizados.map((s) => <ServicoCard key={s.id} servico={s} />)}
              </div>
            </section>
          )}
        </>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-vobi-cream border-b border-vobi-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-vobi-gray uppercase text-[11px] tracking-wider">Cliente</th>
                  <th className="text-left px-4 py-3 font-semibold text-vobi-gray uppercase text-[11px] tracking-wider">Data</th>
                  <th className="text-left px-4 py-3 font-semibold text-vobi-gray uppercase text-[11px] tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vobi-border">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-sm text-vobi-gray">
                      {hasFilters ? 'Nenhum serviço corresponde aos filtros.' : 'Nenhum serviço cadastrado.'}
                    </td>
                  </tr>
                ) : paginated.map((s) => {
                  const { variant, label } = getStatusBadge(s)
                  const href = s.status === 'finalizado' ? `/servicos/${s.id}/resumo` : `/servicos/${s.id}`
                  return (
                    <tr key={s.id} className="hover:bg-vobi-cream/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={href} className="block">
                          <p className="font-semibold text-vobi-dark hover:text-vobi-primary transition-colors">{s.cliente_nome}</p>
                          <p className="text-xs text-vobi-gray-light mt-0.5 line-clamp-1">
                            {s.endereco}
                            {s.cidade && s.estado && ` · ${s.cidade}/${s.estado}`}
                          </p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-vobi-gray whitespace-nowrap">
                        {new Date(s.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={variant}>{label}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-vobi-border bg-vobi-cream/40 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-vobi-gray">
              <label htmlFor="page-size" className="font-medium">Itens por página:</label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => changePageSize(Number(e.target.value))}
                className="px-2 py-1 rounded-md border border-vobi-border bg-white text-vobi-dark focus:outline-none focus:ring-2 focus:ring-vobi-primary/20 focus:border-vobi-primary"
              >
                {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <p className="text-xs text-vobi-gray">
              {total === 0
                ? 'Nenhum registro'
                : `Exibindo ${startIdx + 1}–${endIdx} de ${total} registro${total === 1 ? '' : 's'}`}
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-vobi-border bg-white text-vobi-gray hover:text-vobi-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Página anterior"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <span className="px-2 text-xs text-vobi-gray whitespace-nowrap">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-vobi-border bg-white text-vobi-gray hover:text-vobi-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Próxima página"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        </Card>
      )}
    </>
  )
}

function ServicoCard({ servico }: { servico: Servico }) {
  const { variant, label } = getStatusBadge(servico)
  const finalized = servico.status === 'finalizado'

  return (
    <Link href={`/servicos/${servico.id}`}>
      <Card className="p-4 sm:p-5 hover:shadow-card-hover hover:border-vobi-primary/30 transition-all duration-200 cursor-pointer group h-full">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-vobi-dark group-hover:text-vobi-primary transition-colors text-[15px] line-clamp-1 flex-1 min-w-0">
            {servico.cliente_nome}
          </h3>
          <Badge variant={variant}>{label}</Badge>
        </div>

        <p className="text-sm text-vobi-gray mb-1 line-clamp-1">
          {servico.endereco}
          {servico.cidade && servico.estado && ` · ${servico.cidade}/${servico.estado}`}
        </p>
        <p className="text-xs text-vobi-gray-light">Ar-condicionado · {servico.btus} BTUs</p>

        <div className="mt-3 pt-3 border-t border-vobi-border flex items-center justify-between">
          <span className="text-xs text-vobi-gray-light">
            {new Date(servico.created_at).toLocaleDateString('pt-BR')}
          </span>
          <span className="text-xs text-vobi-primary font-semibold group-hover:underline">
            {finalized ? 'Ver resumo →' : 'Abrir checklist →'}
          </span>
        </div>
      </Card>
    </Link>
  )
}
