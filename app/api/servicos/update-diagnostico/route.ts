import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { servicoId, diagnostico } = await req.json()
    if (!servicoId) return NextResponse.json({ error: 'servicoId ausente' }, { status: 400 })
    if (typeof diagnostico !== 'string') return NextResponse.json({ error: 'diagnostico inválido' }, { status: 400 })

    const trimmed = diagnostico.trim()
    if (!trimmed) return NextResponse.json({ error: 'diagnostico vazio' }, { status: 400 })
    if (trimmed.length > 5000) return NextResponse.json({ error: 'diagnostico muito longo (máx. 5000)' }, { status: 400 })

    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('servicos')
      .update({ diagnostico_ia: trimmed })
      .eq('id', servicoId)
      .eq('user_id', session.user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ diagnostico: trimmed })
  } catch (err: any) {
    console.error('[update-diagnostico]', err)
    return NextResponse.json({ error: err.message ?? 'Erro inesperado' }, { status: 500 })
  }
}
