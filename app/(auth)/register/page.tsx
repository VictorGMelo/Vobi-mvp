'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name, company: form.company },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: form.name,
        company: form.company,
        email: form.email,
      })
    }

    router.push('/servicos')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-vobi-cream p-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/vobi-logo.svg" alt="Vobi" className="h-8 w-auto" />
        </div>

        <Card className="p-8 shadow-auth">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-vobi-dark">Criar sua conta</h1>
            <p className="text-vobi-gray text-sm mt-1">Comece grátis, sem cartão de crédito</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-vobi-dark mb-1.5">Nome completo</label>
              <Input name="name" placeholder="João Silva" value={form.name} onChange={handleChange} required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-vobi-dark mb-1.5">Empresa / Escritório</label>
              <Input name="company" placeholder="Silva Engenharia" value={form.company} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-vobi-dark mb-1.5">E-mail</label>
              <Input type="email" name="email" placeholder="seu@email.com" value={form.email} onChange={handleChange} required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-vobi-dark mb-1.5">Senha</label>
              <Input type="password" name="password" placeholder="Mín. 8 caracteres" value={form.password} onChange={handleChange} required minLength={8} />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 flex items-start gap-2">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Criar conta grátis
            </Button>
          </form>

          <p className="text-center text-sm text-vobi-gray mt-6">
            Já tem conta?{' '}
            <Link href="/login" className="text-vobi-primary font-semibold hover:underline">
              Entrar
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
