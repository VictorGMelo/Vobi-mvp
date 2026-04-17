import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { servicoId, resumo } = await req.json()
    if (!servicoId) return NextResponse.json({ error: 'servicoId ausente' }, { status: 400 })
    if (typeof resumo !== 'string') return NextResponse.json({ error: 'resumo inválido' }, { status: 400 })

    const trimmed = resumo.trim()
    if (!trimmed) return NextResponse.json({ error: 'resumo vazio' }, { status: 400 })
    if (trimmed.length > 5000) return NextResponse.json({ error: 'resumo muito longo (máx. 5000)' }, { status: 400 })

    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('servicos')
      .update({ resumo_ia: trimmed })
      .eq('id', servicoId)
      .eq('user_id', session.user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ resumo: trimmed })
  } catch (err: any) {
    console.error('[update-resumo]', err)
    return NextResponse.json({ error: err.message ?? 'Erro inesperado' }, { status: 500 })
  }
}
