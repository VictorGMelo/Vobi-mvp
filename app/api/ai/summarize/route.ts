import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateResumoNatural } from '@/lib/ai'
import type { ChecklistItemRow, Servico } from '@/lib/types'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { servicoId } = await req.json()
    if (!servicoId) return NextResponse.json({ error: 'servicoId ausente' }, { status: 400 })

    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: servico } = await supabase
      .from('servicos')
      .select('*')
      .eq('id', servicoId)
      .eq('user_id', session.user.id)
      .single<Servico>()

    if (!servico) return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 })

    const { data: itens } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('servico_id', servicoId)
      .order('ordem')
      .returns<ChecklistItemRow[]>()

    const resumo = await generateResumoNatural({ servico, itens: itens ?? [] })

    await supabase
      .from('servicos')
      .update({ resumo_ia: resumo })
      .eq('id', servicoId)

    return NextResponse.json({ resumo })
  } catch (err: any) {
    console.error('[summarize]', err)
    return NextResponse.json({ error: err.message ?? 'Erro inesperado' }, { status: 500 })
  }
}
