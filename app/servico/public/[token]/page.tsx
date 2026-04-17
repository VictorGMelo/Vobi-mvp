import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createServerClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import {
  CHECKLIST_STATUS_LABEL,
  STATUS_FINAL_LABEL,
  type ChecklistItemRow,
  type ServicePhoto,
  type Servico,
} from '@/lib/types'

export const revalidate = 0

export default async function PublicServicoPage({ params }: { params: { token: string } }) {
  const supabase = createServerClient()

  const { data: servico } = await supabase
    .from('servicos')
    .select('*')
    .eq('public_token', params.token)
    .single<Servico>()

  if (!servico) notFound()

  const { data: itens } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('servico_id', servico.id)
    .order('ordem', { ascending: true })
    .returns<ChecklistItemRow[]>()

  const { data: photos } = await supabase
    .from('service_photos')
    .select('*')
    .eq('servico_id', servico.id)
    .order('ordem', { ascending: true })
    .returns<ServicePhoto[]>()

  const grupos = (itens ?? []).reduce<Record<string, ChecklistItemRow[]>>((acc, item) => {
    const g = item.grupo ?? 'Geral'
    if (!acc[g]) acc[g] = []
    acc[g].push(item)
    return acc
  }, {})

  const total = itens?.length ?? 0
  const ok = (itens ?? []).filter((i) => i.status === 'ok').length
  const ajustados = (itens ?? []).filter((i) => i.status === 'ajustado').length
  const problemas = (itens ?? []).filter((i) => i.status === 'problema').length

  const statusBadgeVariant: 'success' | 'warning' | 'danger' = servico.status_final === 'ok'
    ? 'success'
    : servico.status_final === 'ajuste_realizado'
      ? 'warning'
      : 'danger'

  const dataVisita = new Date(servico.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-vobi-cream">
      <div className="bg-white border-b border-vobi-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/vobi-logo.svg" alt="Vobi" className="h-6 w-auto" />
          <span className="text-vobi-gray text-sm">· Relatório da visita</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <p className="text-xs text-vobi-gray uppercase tracking-wide mb-1">{dataVisita}</p>
          <h1 className="text-xl sm:text-2xl font-bold text-vobi-dark mb-1">
            Visita técnica — {servico.cliente_nome}
          </h1>
          <div className="flex items-center gap-2 text-sm text-vobi-gray flex-wrap">
            <span>{servico.endereco}</span>
            {servico.cidade && servico.estado && <><span>·</span><span>{servico.cidade}/{servico.estado}</span></>}
            <span>·</span>
            <span>Ar-condicionado {servico.btus} BTUs</span>
            {servico.numero_serie && <><span>·</span><span>Série {servico.numero_serie}</span></>}
          </div>
        </div>

        {servico.status_final && (
          <Card className="p-4 mb-4 flex items-center gap-3">
            <Badge variant={statusBadgeVariant}>{STATUS_FINAL_LABEL[servico.status_final]}</Badge>
            <span className="text-sm text-vobi-gray">Status da visita</span>
          </Card>
        )}

        {/* Resumo natural */}
        {servico.resumo_ia && (
          <Card className="p-5 mb-4">
            <h2 className="text-sm font-semibold text-vobi-dark mb-3">Resumo</h2>
            <p className="text-sm text-vobi-dark leading-relaxed whitespace-pre-wrap">{servico.resumo_ia}</p>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
          {[
            { label: 'Total', value: total, color: 'text-vobi-dark' },
            { label: 'OK', value: ok, color: 'text-green-600' },
            { label: 'Ajustados', value: ajustados, color: 'text-amber-600' },
            { label: 'Problemas', value: problemas, color: 'text-red-600' },
          ].map((s) => (
            <Card key={s.label} className="p-3 sm:p-4 text-center">
              <p className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] sm:text-xs text-vobi-gray mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Fotos */}
        {photos && photos.length > 0 && (
          <Card className="p-4 mb-4">
            <h2 className="text-sm font-semibold text-vobi-dark mb-3">Fotos da visita</h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {photos.map((p) => (
                <a key={p.id} href={p.public_url} target="_blank" rel="noreferrer" className="relative aspect-square rounded-lg overflow-hidden border border-vobi-border block bg-vobi-cream">
                  <Image src={p.public_url} alt="Foto do serviço" fill sizes="(max-width: 640px) 33vw, 20vw" className="object-cover" unoptimized />
                </a>
              ))}
            </div>
          </Card>
        )}

        {/* Checklist */}
        <div className="space-y-4">
          {Object.entries(grupos).map(([grupo, items]) => (
            <Card key={grupo} className="overflow-hidden">
              <div className="px-4 py-3 bg-vobi-cream border-b border-vobi-border">
                <h3 className="text-sm font-semibold text-vobi-dark">{grupo}</h3>
              </div>
              <ul className="divide-y divide-vobi-border">
                {items.map((item) => {
                  const variant: 'success' | 'warning' | 'danger' | 'default' =
                    item.status === 'ok' ? 'success'
                      : item.status === 'ajustado' ? 'warning'
                      : item.status === 'problema' ? 'danger'
                      : 'default'
                  return (
                    <li key={item.id} className="px-4 py-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-vobi-dark">{item.descricao}</p>
                        {item.numeric_value !== null && item.numeric_value !== undefined && (
                          <p className="text-xs text-vobi-gray mt-0.5">
                            Medido: <span className="font-semibold">{item.numeric_value}{item.unit ?? ''}</span>
                          </p>
                        )}
                        {item.observacao && <p className="text-xs text-vobi-gray mt-0.5 italic">"{item.observacao}"</p>}
                      </div>
                      <Badge variant={variant}>{CHECKLIST_STATUS_LABEL[item.status]}</Badge>
                    </li>
                  )
                })}
              </ul>
            </Card>
          ))}
        </div>

        <p className="text-center text-xs text-vobi-gray/60 mt-8">
          Relatório gerado por Vobi · {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  )
}
