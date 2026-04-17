import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { STATUS_FINAL_LABEL, type Servico } from '@/lib/types'

export default async function ServicosPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  const { data: servicos } = await supabase
    .from('servicos')
    .select('*')
    .eq('user_id', session!.user.id)
    .order('created_at', { ascending: false })
    .returns<Servico[]>()

  const emAndamento = (servicos ?? []).filter((s) => s.status === 'em_andamento')
  const finalizados = (servicos ?? []).filter((s) => s.status === 'finalizado')

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-vobi-dark">Serviços</h1>
          <p className="text-vobi-gray text-sm mt-0.5">Visitas técnicas de revisão</p>
        </div>
        <Link href="/servicos/novo">
          <Button>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Novo serviço
          </Button>
        </Link>
      </div>

      {(!servicos || servicos.length === 0) && (
        <Card className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 bg-vobi-primary-light rounded-xl flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-vobi-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-vobi-dark font-semibold mb-1">Nenhuma visita ainda</h3>
          <p className="text-vobi-gray text-sm mb-5">Comece registrando a primeira revisão de ar-condicionado.</p>
          <Link href="/servicos/novo">
            <Button size="sm">Criar primeira visita</Button>
          </Link>
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
    </div>
  )
}

function ServicoCard({ servico }: { servico: Servico }) {
  const finalized = servico.status === 'finalizado'
  const statusVariant: 'success' | 'warning' | 'danger' =
    !finalized || !servico.status_final ? 'warning'
      : servico.status_final === 'ok' ? 'success'
      : servico.status_final === 'ajuste_realizado' ? 'warning'
      : 'danger'
  const statusLabel = finalized && servico.status_final ? STATUS_FINAL_LABEL[servico.status_final] : 'Em andamento'

  return (
    <Link href={`/servicos/${servico.id}`}>
      <Card className="p-4 sm:p-5 hover:shadow-card-hover hover:border-vobi-primary/30 transition-all duration-200 cursor-pointer group h-full">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-vobi-dark group-hover:text-vobi-primary transition-colors text-[15px] line-clamp-1 flex-1 min-w-0">
            {servico.cliente_nome}
          </h3>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
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
