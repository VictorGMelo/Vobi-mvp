import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { type Servico } from '@/lib/types'
import { ServicosView } from './ServicosView'

export default async function ServicosPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  const { data: servicos } = await supabase
    .from('servicos')
    .select('*')
    .eq('user_id', session!.user.id)
    .order('created_at', { ascending: false })
    .returns<Servico[]>()

  const list = servicos ?? []

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

      {list.length === 0 ? (
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
      ) : (
        <ServicosView servicos={list} />
      )}
    </div>
  )
}
