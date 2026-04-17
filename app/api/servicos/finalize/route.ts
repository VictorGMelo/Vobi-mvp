import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'
import { generateResumoNatural } from '@/lib/ai'
import { sendSummaryEmail } from '@/lib/email'
import type { StatusFinal } from '@/lib/types'

const VALID_FINAL = new Set<StatusFinal>(['ok', 'ajuste_realizado', 'retorno_necessario'])

export async function POST(req: NextRequest) {
  try {
    const { servicoId, statusFinal } = await req.json() as { servicoId: string; statusFinal: StatusFinal }

    if (!servicoId || !VALID_FINAL.has(statusFinal)) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: servico } = await supabase
      .from('servicos')
      .select('*')
      .eq('id', servicoId)
      .eq('user_id', session.user.id)
      .single()

    if (!servico) return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 })
    if (servico.status === 'finalizado') {
      return NextResponse.json({ error: 'Serviço já finalizado' }, { status: 409 })
    }

    const { data: itens } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('servico_id', servicoId)
      .order('ordem')

    const pendentes = (itens ?? []).filter((i) => i.status === 'pendente')
    if (pendentes.length > 0) {
      return NextResponse.json({
        error: 'Checklist incompleto',
        pendentes: pendentes.length,
      }, { status: 422 })
    }

    const problemasSemObs = (itens ?? []).filter((i) => i.status === 'problema' && !i.observacao?.trim())
    if (problemasSemObs.length > 0) {
      return NextResponse.json({
        error: 'Itens com "Problema" precisam de observação',
        count: problemasSemObs.length,
      }, { status: 422 })
    }

    // Gerar resumo natural (IA)
    let resumoIa = ''
    try {
      resumoIa = await generateResumoNatural({ servico, itens: itens ?? [] })
    } catch (err) {
      console.error('[finalize] falha no resumo IA', err)
      resumoIa = '' // segue sem resumo — pode ser regenerado
    }

    const token = servico.public_token ?? nanoid(24)
    const now = new Date().toISOString()

    const { error: updErr } = await supabase
      .from('servicos')
      .update({
        status: 'finalizado',
        status_final: statusFinal,
        finalizado_em: now,
        resumo_ia: resumoIa || null,
        public_token: token,
        updated_at: now,
      })
      .eq('id', servicoId)

    if (updErr) throw updErr

    // Dispara e-mail automático se há cliente_email
    let emailSent = false
    let emailError: string | null = null
    if (servico.cliente_email) {
      try {
        await sendSummaryEmail({
          servicoId,
          supabase,
          userId: session.user.id,
        })
        emailSent = true
        await supabase
          .from('servicos')
          .update({ email_enviado_em: new Date().toISOString(), email_erro: null })
          .eq('id', servicoId)
      } catch (err: any) {
        emailError = err.message ?? 'Falha no envio'
        await supabase
          .from('servicos')
          .update({ email_erro: emailError })
          .eq('id', servicoId)
      }
    }

    return NextResponse.json({
      ok: true,
      publicToken: token,
      emailSent,
      emailError,
    })
  } catch (err: any) {
    console.error('[finalize]', err)
    return NextResponse.json({ error: err.message ?? 'Erro inesperado' }, { status: 500 })
  }
}
