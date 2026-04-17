'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // PRD CA-US-01: não expor qual campo está errado
      setError('E-mail ou senha inválidos.')
      setLoading(false)
    } else {
      router.push('/servicos')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Form panel */}
      <div className="flex-1 flex flex-col min-h-screen px-6 sm:px-12 lg:px-20 py-8">
        {/* Logo */}
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/vobi-logo.svg" alt="Vobi" className="h-7 w-auto" />
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-[440px]">
            <h1 className="text-3xl font-bold text-vobi-dark leading-tight">Olá!</h1>
            <h2 className="text-2xl font-bold text-vobi-dark leading-tight mt-0.5">
              Prazer ver você novamente por aqui!
            </h2>
            <p className="text-sm text-vobi-gray mt-3">Insira seus dados para continuar:</p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              {/* E-mail */}
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
                  className="w-full pl-11 pr-4 py-3 text-sm rounded-xl bg-vobi-cream border border-transparent text-vobi-dark placeholder:text-vobi-gray-light focus:outline-none focus:ring-2 focus:ring-vobi-primary/20 focus:border-vobi-primary transition-colors"
                />
              </div>

              {/* Senha */}
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vobi-gray-light pointer-events-none">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Informe a senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-11 py-3 text-sm rounded-xl bg-vobi-cream border border-transparent text-vobi-dark placeholder:text-vobi-gray-light focus:outline-none focus:ring-2 focus:ring-vobi-primary/20 focus:border-vobi-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-vobi-gray-light hover:text-vobi-dark transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.244 7.244L21 21m-3.878-3.878l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
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
                Avançar
              </Button>
            </form>

            <div className="mt-5">
              <Link href="/forgot-password" className="text-vobi-primary font-semibold text-sm hover:underline">
                Esqueceu a senha?
              </Link>
            </div>

            <p className="text-xs text-vobi-gray mt-6">
              Não tem conta?{' '}
              <Link href="/register" className="text-vobi-primary font-semibold hover:underline">
                Cadastre-se grátis
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 flex-wrap text-xs text-vobi-gray pt-8">
          <span>
            Leia os{' '}
            <a href="https://vobi.com.br/termos-de-uso" target="_blank" rel="noreferrer" className="text-vobi-primary font-semibold hover:underline">
              termos de uso
            </a>{' '}
            da Vobi.
          </span>
        </div>
      </div>

      {/* Brand panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-vobi-primary-light via-vobi-primary-light to-white">
        {/* Decorative circles */}
        <div className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-white/60" />
        <div className="absolute -top-28 -right-28 w-[420px] h-[420px] rounded-full border border-vobi-primary/10" />

        {/* Floating mockup card */}
        <div className="absolute inset-0 flex items-center justify-center p-10">
          <div className="relative w-[min(560px,100%)]">
            <div className="absolute -inset-6 bg-white/40 rounded-[28px] blur-xl" />
            <div className="relative bg-white rounded-2xl shadow-xl border border-vobi-border overflow-hidden">
              <div className="flex items-center gap-2 px-5 h-14 border-b border-vobi-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/vobi-logo.svg" alt="Vobi" className="h-5 w-auto" />
                <span className="ml-2 text-[10px] bg-vobi-primary-light text-vobi-primary font-semibold px-1.5 py-0.5 rounded-md tracking-wide">Service</span>
                <span className="ml-auto text-xs text-vobi-gray">Visita · Revisão AC</span>
              </div>

              <div className="p-5">
                <p className="text-xs text-vobi-gray mb-1">Cliente</p>
                <h3 className="text-base font-bold text-vobi-dark">Carlos — Apto 503</h3>
                <p className="text-xs text-vobi-gray mt-0.5">Ar-condicionado · 12 000 BTUs</p>

                <div className="mt-4 space-y-2">
                  {[
                    { label: 'Filtros de ar — limpeza', state: 'OK', tone: 'success' },
                    { label: 'Dreno de condensado', state: 'Ajustado', tone: 'warning' },
                    { label: 'Pressão de baixa (medida: 62 psi)', state: 'Problema', tone: 'danger' },
                  ].map((i) => (
                    <div key={i.label} className="flex items-center justify-between text-xs">
                      <span className="text-vobi-dark">{i.label}</span>
                      <span
                        className={
                          i.tone === 'success' ? 'px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-semibold'
                            : i.tone === 'warning' ? 'px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold'
                            : 'px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold'
                        }
                      >
                        {i.state}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-vobi-border flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-vobi-primary" />
                  <span className="text-xs text-vobi-gray">Resumo IA gerado em 2s · enviado ao cliente</span>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-vobi-primary/70 font-medium mt-6">
              Checklist de revisão · diagnóstico e resumo por IA
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

