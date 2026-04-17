'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordPage() {
  const supabase = createBrowserClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmed = email.trim()
    if (!EMAIL_RE.test(trimmed)) {
      setError('Informe um e-mail válido.')
      return
    }

    setLoading(true)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const { error: err } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${origin}/reset-password`,
    })

    setLoading(false)

    // Não revelar se o e-mail existe ou não — sempre mostra sucesso genérico.
    if (err && err.status && err.status >= 500) {
      setError('Não foi possível enviar o e-mail agora. Tente novamente em instantes.')
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-screen flex bg-white">
      <div className="flex-1 flex flex-col min-h-screen px-6 sm:px-12 lg:px-20 py-8">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/vobi-logo.svg" alt="Vobi" className="h-7 w-auto" />
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-[440px]">
            {sent ? (
              <>
                <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-vobi-dark leading-tight">E-mail enviado</h1>
                <p className="text-sm text-vobi-gray mt-3 leading-relaxed">
                  Se houver uma conta associada a <span className="font-semibold text-vobi-dark">{email}</span>, você receberá em instantes um e-mail com um link para definir uma nova senha. O link expira em 1 hora.
                </p>
                <p className="text-xs text-vobi-gray-light mt-4">
                  Não recebeu? Verifique a caixa de spam ou tente novamente em alguns minutos.
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <Button type="button" variant="secondary" onClick={() => { setSent(false); setEmail('') }}>
                    Enviar para outro e-mail
                  </Button>
                  <Link href="/login" className="text-sm text-vobi-primary font-semibold hover:underline">
                    Voltar ao login
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-vobi-dark leading-tight">Esqueceu a senha?</h1>
                <p className="text-sm text-vobi-gray mt-3">
                  Informe o e-mail cadastrado. Se existir uma conta, enviaremos um link para você redefinir a senha.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vobi-gray-light pointer-events-none">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      placeholder="Informe seu e-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      className="w-full pl-11 pr-4 py-3 text-sm rounded-xl bg-vobi-cream border border-transparent text-vobi-dark placeholder:text-vobi-gray-light focus:outline-none focus:ring-2 focus:ring-vobi-primary/20 focus:border-vobi-primary transition-colors"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 flex items-start gap-2">
                      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full !rounded-xl !py-3 !text-sm" loading={loading}>
                    Enviar link de redefinição
                  </Button>
                </form>

                <p className="text-xs text-vobi-gray mt-6">
                  Lembrou a senha?{' '}
                  <Link href="/login" className="text-vobi-primary font-semibold hover:underline">
                    Voltar ao login
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
