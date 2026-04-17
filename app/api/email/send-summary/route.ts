import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { sendSummaryEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { servicoId } = await req.json()
    if (!servicoId) return NextResponse.json({ error: 'servicoId ausente' }, { status: 400 })

    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verificar ownership
    const { data: owned } = await supabase
      .from('servicos')
      .select('id')
      .eq('id', servicoId)
      .eq('user_id', session.user.id)
      .single()

    if (!owned) return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 })

    try {
      await sendSummaryEmail({ servicoId, supabase, userId: session.user.id })
      await supabase
        .from('servicos')
        .update({ email_enviado_em: new Date().toISOString(), email_erro: null })
        .eq('id', servicoId)
      return NextResponse.json({ ok: true })
    } catch (err: any) {
      const msg = err.message ?? 'Falha no envio'
      await supabase.from('servicos').update({ email_erro: msg }).eq('id', servicoId)
      return NextResponse.json({ error: msg }, { status: 502 })
    }
  } catch (err: any) {
    console.error('[send-summary]', err)
    return NextResponse.json({ error: err.message ?? 'Erro inesperado' }, { status: 500 })
  }
}
