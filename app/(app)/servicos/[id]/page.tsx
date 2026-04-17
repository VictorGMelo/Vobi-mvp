import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ChecklistItem } from './ChecklistItem'
import { Photos } from './Photos'
import { DiagnoseButton } from './DiagnoseButton'
import { FinalizeButton } from './FinalizeButton'
import { STATUS_FINAL_LABEL, type ChecklistItemRow, type ServicePhoto, type Servico } from '@/lib/types'

export default async function ServicoPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  const { data: servico } = await supabase
    .from('servicos')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', session!.user.id)
    .single<Servico>()

  if (!servico) notFound()

  const { data: itens } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('servico_id', params.id)
    .order('ordem', { ascending: true })
    .returns<ChecklistItemRow[]>()

  const { data: photos } = await supabase
    .from('service_photos')
    .select('*')
    .eq('servico_id', params.id)
    .order('ordem', { ascending: true })
    .returns<ServicePhoto[]>()

  const isReadonly = servico.status === 'finalizado'

  const grupos = (itens ?? []).reduce<Record<string, ChecklistItemRow[]>>((acc, item) => {
    const g = item.grupo ?? 'Geral'
    if (!acc[g]) acc[g] = []
    acc[g].push(item)
    return acc
  }, {})

  const total = itens?.length ?? 0
  const marcados = (itens ?? []).filter((i) => i.status !== 'pendente').length
  const pendentes = total - marcados
  const problemasSemObs = (itens ?? []).filter((i) => i.status === 'problema' && !i.observacao?.trim()).length
  const pct = total > 0 ? Math.round((marcados / total) * 100) : 0

  const hasDiagnostico = !!servico.diagnostico_ia?.trim()
  const canFinalize = !isReadonly && pendentes === 0 && problemasSemObs === 0 && hasDiagnostico
  const finalizeDisabledReason = !canFinalize
    ? pendentes > 0
      ? `${pendentes} item(ns) pendente(s)`
      : problemasSemObs > 0
        ? `${problemasSemObs} item(ns) com Problema sem observação`
        : !hasDiagnostico
          ? 'Gere a sugestão de diagnóstico abaixo'
          : undefined
    : undefined

  return (
    <div className="max-w-4xl mx-auto">
      <div className="sticky top-14 z-20 bg-vobi-cream/95 backdrop-blur-sm border-b border-vobi-border px-4 sm:px-8 py-3 sm:py-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <Link href="/servicos" className="mt-1.5 text-vobi-gray hover:text-vobi-dark transition-colors shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-vobi-dark truncate">{servico.cliente_nome}</h1>
                {isReadonly ? (
                  <Badge variant="success">
                    Finalizado {servico.status_final ? `· ${STATUS_FINAL_LABEL[servico.status_final]}` : ''}
                  </Badge>
                ) : (
                  <Badge variant="warning">Em andamento</Badge>
                )}
              </div>
              <div className="text-xs sm:text-sm text-vobi-gray">
                <span>{servico.endereco}</span>
                {servico.cidade && servico.estado && <><span className="mx-1">·</span><span>{servico.cidade}/{servico.estado}</span></>}
                <span className="mx-1">·</span>
                <span>{servico.btus} BTUs</span>
                {servico.numero_serie && <><span className="mx-1">·</span><span>Série {servico.numero_serie}</span></>}
              </div>
            </div>
          </div>

          {!isReadonly && (
            <FinalizeButton
              servicoId={servico.id}
              disabled={!canFinalize}
              disabledReason={finalizeDisabledReason}
            />
          )}
          {isReadonly && (
            <Link href={`/servicos/${servico.id}/resumo`}>
              <span className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-vobi-primary text-white hover:bg-vobi-primary-hover transition-colors shadow-sm">
                Ver resumo →
              </span>
            </Link>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-8 pt-4 sm:pt-6">

      {/* Observação inicial */}
      {servico.observacao_inicial && (
        <Card className="p-4 mb-4 bg-vobi-cream/60">
          <p className="text-xs font-semibold text-vobi-gray mb-1 uppercase tracking-wide">Relato do cliente</p>
          <p className="text-sm text-vobi-dark">{servico.observacao_inicial}</p>
        </Card>
      )}

      {/* Progresso */}
      <Card className="p-5 mb-4 flex items-center gap-5">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-vobi-dark">Progresso do checklist</span>
            <span className="text-sm font-bold text-vobi-primary">{pct}%</span>
          </div>
          <div className="h-2 bg-vobi-cream rounded-full overflow-hidden">
            <div
              className="h-full bg-vobi-primary rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="text-right shrink-0 pl-2 border-l border-vobi-border">
          <p className="text-xl font-bold text-vobi-dark">{marcados}/{total}</p>
          <p className="text-xs text-vobi-gray">marcados</p>
        </div>
      </Card>

      {/* Checklist */}
      <div className="space-y-4 mb-6">
        {Object.entries(grupos).map(([grupo, items]) => (
          <Card key={grupo} className="overflow-hidden">
            <div className="px-4 py-3 bg-vobi-cream border-b border-vobi-border">
              <h3 className="text-sm font-semibold text-vobi-dark">{grupo}</h3>
            </div>
            <ul className="divide-y divide-vobi-border">
              {items.map((item) => (
                <ChecklistItem key={item.id} item={item} readonly={isReadonly} />
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {/* Fotos */}
      <Card className="p-5 mb-6">
        <Photos
          servicoId={servico.id}
          userId={session!.user.id}
          initialPhotos={photos ?? []}
          readonly={isReadonly}
        />
      </Card>

      {/* Diagnóstico IA — último passo antes de finalizar */}
      <DiagnoseButton
        servicoId={servico.id}
        progressPct={pct}
        initialDiagnostico={servico.diagnostico_ia}
        readonly={isReadonly}
      />
      </div>
    </div>
  )
}
