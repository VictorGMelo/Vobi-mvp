import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'
import { STATUS_FINAL_LABEL, type Servico } from '@/lib/types'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY ausente')
  return new Resend(key)
}

function escapeHtml(v: string) {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function baseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000'
}

/**
 * Envia resumo ao cliente final após finalização.
 * PRD §9 — template HTML Vobi.
 */
export async function sendSummaryEmail(params: {
  servicoId: string
  supabase: SupabaseClient
  userId: string
}): Promise<void> {
  const { servicoId, supabase, userId } = params

  const { data: servico, error } = await supabase
    .from('servicos')
    .select('*')
    .eq('id', servicoId)
    .single()

  if (error || !servico) throw new Error('Serviço não encontrado')
  if (!servico.cliente_email) throw new Error('Cliente sem e-mail cadastrado')
  if (!servico.public_token) throw new Error('public_token ausente — finalize o serviço antes')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, company')
    .eq('id', userId)
    .single()

  const senderName = profile?.company || profile?.full_name || 'Equipe Vobi'
  const publicUrl = `${baseUrl()}/servico/public/${servico.public_token}`
  const dataVisita = new Date(servico.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  const html = buildHtml({
    senderName,
    clienteNome: servico.cliente_nome,
    dataVisita,
    resumoIa: servico.resumo_ia || 'Visita concluída.',
    statusFinalLabel: servico.status_final ? STATUS_FINAL_LABEL[servico.status_final as keyof typeof STATUS_FINAL_LABEL] : '',
    publicUrl,
  })

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Vobi <onboarding@resend.dev>'
  const fromField = fromEmail.includes('<') ? fromEmail : `${senderName} via Vobi <${fromEmail}>`

  const resend = getResend()
  const { error: sendError } = await resend.emails.send({
    from: fromField,
    to: servico.cliente_email,
    subject: `Resumo da visita técnica — ${servico.cliente_nome}`,
    html,
  })

  if (sendError) throw new Error(sendError.message || 'Falha no envio')
}

function buildHtml(p: {
  senderName: string
  clienteNome: string
  dataVisita: string
  resumoIa: string
  statusFinalLabel: string
  publicUrl: string
}) {
  const { senderName, clienteNome, dataVisita, resumoIa, statusFinalLabel, publicUrl } = p
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resumo da visita — Vobi</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="margin-bottom:24px;">
      <img src="${baseUrl()}/vobi-logo.png" alt="Vobi" width="72" height="29" style="display:block;border:0;outline:none;text-decoration:none;" />
    </div>

    <div style="background:#fff;border-radius:16px;border:1px solid #E2E8F0;padding:32px 28px;">
      <p style="margin:0 0 6px;color:#6B7280;font-size:13px;">${escapeHtml(dataVisita)}</p>
      <h1 style="margin:0 0 6px;font-size:20px;color:#111827;">Olá, ${escapeHtml(clienteNome)}</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">Segue o resumo da visita técnica realizada por ${escapeHtml(senderName)}.</p>

      ${statusFinalLabel ? `
      <div style="background:#EEF2FF;border:1px solid #C7D2FE;border-radius:10px;padding:10px 14px;margin-bottom:20px;">
        <span style="font-size:12px;color:#2D5BFF;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Status</span>
        <p style="margin:2px 0 0;font-size:15px;font-weight:600;color:#111827;">${escapeHtml(statusFinalLabel)}</p>
      </div>` : ''}

      <h2 style="margin:0 0 10px;font-size:14px;color:#111827;">O que foi feito</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${escapeHtml(resumoIa)}</p>

      <div style="text-align:center;">
        <a href="${publicUrl}" style="display:inline-block;background:#2D5BFF;color:#fff;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
          Ver relatório completo
        </a>
      </div>
    </div>

    <p style="text-align:center;font-size:12px;color:#9CA3AF;margin-top:20px;">
      Enviado por ${escapeHtml(senderName)} via Vobi
    </p>
  </div>
</body>
</html>`
}
