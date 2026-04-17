import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { STATUS_FINAL_LABEL, type Servico } from '@/lib/types'
import { ResumoActions } from './ResumoActions'
import { ResumoEditor } from './ResumoEditor'

export default async function ResumoPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  const { data: servico } = await supabase
    .from('servicos')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', session!.user.id)
    .single<Servico>()

  if (!servico) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || ''
  const publicUrl = servico.public_token ? `${baseUrl}/servico/public/${servico.public_token}` : null
  const isFinalized = servico.status === 'finalizado'

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/servicos/${params.id}`} className="text-vobi-gray hover:text-vobi-dark transition-colors shrink-0" title="Voltar ao checklist">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-vobi-dark">Resumo do serviço</h1>
            <p className="text-vobi-gray text-sm mt-0.5">
              {servico.cliente_nome} · {servico.endereco}
              {servico.cidade && servico.estado && ` · ${servico.cidade}/${servico.estado}`}
            </p>
          </div>
        </div>

        <Link
          href="/servicos"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-white border border-vobi-border text-vobi-dark hover:bg-vobi-cream hover:border-vobi-gray-light transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
          Lista de serviços
        </Link>
      </div>

      {!isFinalized && (
        <Card className="p-5 mb-4 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800">
            O serviço ainda não foi finalizado. Volte ao checklist para concluir e disparar o envio ao cliente.
          </p>
        </Card>
      )}

      {isFinalized && servico.status_final && (
        <Card className="p-5 mb-4">
          <div className="flex items-center gap-3">
            <Badge variant="success">Finalizado</Badge>
            <span className="text-sm text-vobi-dark font-semibold">Status: {STATUS_FINAL_LABEL[servico.status_final]}</span>
            {servico.finalizado_em && (
              <span className="text-xs text-vobi-gray ml-auto">
                {new Date(servico.finalizado_em).toLocaleString('pt-BR')}
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Resumo IA */}
      <Card className="p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-vobi-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <h2 className="text-sm font-semibold text-vobi-dark">Resumo para o cliente</h2>
          <Badge variant="pending" className="ml-auto">IA · Haiku 4.5</Badge>
        </div>
        <ResumoEditor servicoId={servico.id} initialResumo={servico.resumo_ia} />
      </Card>

      {/* Ações */}
      <ResumoActions
        servicoId={servico.id}
        clienteEmail={servico.cliente_email}
        publicUrl={publicUrl}
        emailEnviadoEm={servico.email_enviado_em}
        emailErro={servico.email_erro}
        hasResumo={!!servico.resumo_ia}
        isFinalized={isFinalized}
      />
    </div>
  )
}
