import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateDiagnostico } from '@/lib/ai'
import type { ChecklistItemRow, Servico } from '@/lib/types'

export const maxDuration = 15 // segundos

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
    if (servico.status === 'finalizado') {
      return NextResponse.json({ error: 'Serviço finalizado' }, { status: 409 })
    }

    const { data: itens } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('servico_id', servicoId)
      .order('ordem')
      .returns<ChecklistItemRow[]>()

    const all = itens ?? []
    const pendentes = all.filter((i) => i.status === 'pendente').length
    if (pendentes > 0) {
      return NextResponse.json({ error: 'Marque todos os itens do checklist antes de gerar o diagnóstico.' }, { status: 422 })
    }

    const diagnostico = await generateDiagnostico({ servico, itens: all })

    await supabase
      .from('servicos')
      .update({ diagnostico_ia: diagnostico })
      .eq('id', servicoId)

    return NextResponse.json({ diagnostico })
  } catch (err: any) {
    console.error('[diagnose]', err)
    return NextResponse.json({ error: err.message ?? 'Erro inesperado' }, { status: 500 })
  }
}
