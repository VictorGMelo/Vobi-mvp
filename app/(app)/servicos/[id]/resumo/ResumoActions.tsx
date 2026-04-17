'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface ResumoActionsProps {
  servicoId: string
  clienteEmail: string | null
  publicUrl: string | null
  emailEnviadoEm: string | null
  emailErro: string | null
  hasResumo: boolean
  isFinalized: boolean
}

export function ResumoActions({
  servicoId,
  clienteEmail,
  publicUrl,
  emailEnviadoEm,
  emailErro,
  hasResumo,
  isFinalized,
}: ResumoActionsProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [regenerating, setRegenerating] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendOk, setResendOk] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function regenerate() {
    setRegenerating(true)
    setLocalError(null)
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicoId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao gerar resumo')
      startTransition(() => router.refresh())
    } catch (e: any) {
      setLocalError(e.message)
    } finally {
      setRegenerating(false)
    }
  }

  async function resend() {
    setResending(true)
    setLocalError(null)
    setResendOk(false)
    try {
      const res = await fetch('/api/email/send-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicoId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao enviar e-mail')
      setResendOk(true)
      startTransition(() => router.refresh())
    } catch (e: any) {
      setLocalError(e.message)
    } finally {
      setResending(false)
    }
  }

  function copyLink() {
    if (!publicUrl) return
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* Regerar resumo */}
      {isFinalized && (
        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold text-vobi-dark">Resumo IA</h3>
              <p className="text-xs text-vobi-gray">Gerar novamente substitui o texto atual.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={regenerate} loading={regenerating}>
              {hasResumo ? 'Gerar novamente' : 'Gerar resumo'}
            </Button>
          </div>
        </Card>
      )}

      {/* Link público */}
      {publicUrl && (
        <Card className="p-5 mb-4">
          <h3 className="text-sm font-semibold text-vobi-dark mb-1">Link público para o cliente</h3>
          <p className="text-xs text-vobi-gray mb-3">Acesso sem login — pode ser arquivado pelo cliente.</p>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              readOnly
              value={publicUrl}
              className="flex-1 min-w-0 text-xs px-3 py-2 bg-vobi-cream rounded-lg border border-vobi-border text-vobi-gray font-mono"
            />
            <Button variant="secondary" size="sm" onClick={copyLink}>
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
          </div>
        </Card>
      )}

      {/* E-mail */}
      {isFinalized && (
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold text-vobi-dark">E-mail para o cliente</h3>
              {clienteEmail ? (
                <p className="text-xs text-vobi-gray">Destinatário: {clienteEmail}</p>
              ) : (
                <p className="text-xs text-amber-700">Nenhum e-mail cadastrado no serviço.</p>
              )}
            </div>
            {clienteEmail && (
              <Button size="sm" onClick={resend} loading={resending}>
                {emailEnviadoEm ? 'Reenviar' : 'Enviar'}
              </Button>
            )}
          </div>

          {emailEnviadoEm && !emailErro && !resendOk && (
            <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              Enviado em {new Date(emailEnviadoEm).toLocaleString('pt-BR')}
            </div>
          )}

          {resendOk && (
            <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              E-mail enviado com sucesso.
            </div>
          )}

          {(emailErro || localError) && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
              {localError || `Último erro: ${emailErro}`}
            </div>
          )}
        </Card>
      )}
    </>
  )
}
