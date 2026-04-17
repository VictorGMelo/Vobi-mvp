'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createBrowserClient()

  const [ready, setReady] = useState(false)
  const [invalidLink, setInvalidLink] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Supabase processa o token de recovery automaticamente e dispara um PASSWORD_RECOVERY event
    // com uma sessão temporária. Se não houver sessão após 1.5s, o link é inválido/expirado.
    let resolved = false

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        resolved = true
        setReady(true)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        resolved = true
        setReady(true)
      }
    })

    const timeout = setTimeout(() => {
      if (!resolved) setInvalidLink(true)
    }, 1500)

    return () => {
      sub.subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não conferem.')
      return
    }

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })

    if (err) {
      setError(err.message || 'Não foi possível atualizar a senha. Tente novamente.')
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    setTimeout(() => {
      router.push('/servicos')
      router.refresh()
    }, 1500)
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
            {invalidLink ? (
              <>
                <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-vobi-dark leading-tight">Link inválido ou expirado</h1>
                <p className="text-sm text-vobi-gray mt-3">
                  O link que você usou não é mais válido. Peça um novo link de redefinição.
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <Link href="/forgot-password">
                    <Button type="button">Pedir novo link</Button>
                  </Link>
                  <Link href="/login" className="text-sm text-vobi-primary font-semibold hover:underline">
                    Voltar ao login
                  </Link>
                </div>
              </>
            ) : !ready ? (
              <div className="flex items-center gap-3 text-sm text-vobi-gray">
                <svg className="w-5 h-5 animate-spin text-vobi-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Validando link...
              </div>
            ) : done ? (
              <>
                <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-vobi-dark leading-tight">Senha atualizada</h1>
                <p className="text-sm text-vobi-gray mt-3">
                  Redirecionando para o app...
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-vobi-dark leading-tight">Nova senha</h1>
                <p className="text-sm text-vobi-gray mt-3">
                  Escolha uma senha forte com pelo menos 8 caracteres.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vobi-gray-light pointer-events-none">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Nova senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoFocus
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

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vobi-gray-light pointer-events-none">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirme a nova senha"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      minLength={8}
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
                    Salvar nova senha
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
