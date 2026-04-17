'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { flattenChecklistTemplate } from '@/lib/data/checklist-template'
import { BRAZILIAN_STATES } from '@/lib/data/brazilian-states'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Máscara BR: (XX) XXXX-XXXX (fixo) ou (XX) XXXXX-XXXX (celular)
function formatPhoneBR(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
const INITIAL_FORM = {
  cliente_nome: '',
  cliente_email: '',
  cliente_telefone: '',
  endereco: '',
  estado: '',
  cidade: '',
  btus: '',
  numero_serie: '',
  observacao_inicial: '',
}

export default function NovoServicoPage() {
  const router = useRouter()
  const supabase = createBrowserClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState(INITIAL_FORM)
  const [confirmExit, setConfirmExit] = useState(false)
  const [cidades, setCidades] = useState<string[]>([])
  const [loadingCidades, setLoadingCidades] = useState(false)
  const [cidadesError, setCidadesError] = useState<string | null>(null)

  const isDirty = Object.values(form).some((v) => v.trim() !== '')

  // PRD-friendly UX: avisar antes de sair com formulário preenchido (refresh/close/back do navegador)
  useEffect(() => {
    if (!isDirty || loading) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty, loading])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    const next = name === 'cliente_telefone' ? formatPhoneBR(value) : value
    setForm({ ...form, [name]: next })
    setFieldErrors({ ...fieldErrors, [name]: '' })
  }

  function handleEstadoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const estado = e.target.value
    setForm((prev) => ({ ...prev, estado, cidade: '' }))
    setFieldErrors((prev) => ({ ...prev, estado: '', cidade: '' }))
    setCidadesError(null)
  }

  useEffect(() => {
    if (!form.estado) {
      setCidades([])
      return
    }
    const controller = new AbortController()
    setLoadingCidades(true)
    setCidadesError(null)
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${form.estado}/municipios`, {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error('Erro ao carregar cidades')
        return r.json()
      })
      .then((data: Array<{ nome: string }>) => {
        setCidades(data.map((m) => m.nome))
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setCidadesError('Não foi possível carregar as cidades. Tente novamente.')
        setCidades([])
      })
      .finally(() => setLoadingCidades(false))
    return () => controller.abort()
  }, [form.estado])

  function attemptExit() {
    if (isDirty && !loading) {
      setConfirmExit(true)
    } else {
      router.push('/servicos')
    }
  }

  function confirmAndExit() {
    setConfirmExit(false)
    router.push('/servicos')
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!form.cliente_nome.trim()) errs.cliente_nome = 'Obrigatório'
    if (!form.endereco.trim()) errs.endereco = 'Obrigatório'
    if (!form.estado) errs.estado = 'Obrigatório'
    if (!form.cidade) errs.cidade = 'Obrigatório'

    const btusNum = Number(form.btus)
    if (!form.btus.trim()) {
      errs.btus = 'Obrigatório'
    } else if (!Number.isFinite(btusNum) || btusNum <= 0 || !Number.isInteger(btusNum)) {
      errs.btus = 'Informe a capacidade em BTUs (número inteiro)'
    }

    if (form.cliente_email.trim() && !EMAIL_RE.test(form.cliente_email.trim())) {
      errs.cliente_email = 'E-mail inválido'
    }

    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Não autenticado')

      const { data: servico, error: insertError } = await supabase
        .from('servicos')
        .insert({
          user_id: session.user.id,
          cliente_nome: form.cliente_nome.trim(),
          cliente_email: form.cliente_email.trim() || null,
          cliente_telefone: form.cliente_telefone.trim() || null,
          endereco: form.endereco.trim(),
          estado: form.estado,
          cidade: form.cidade,
          tipo_equipamento: 'ar-condicionado',
          btus: Number(form.btus),
          numero_serie: form.numero_serie.trim() || null,
          observacao_inicial: form.observacao_inicial.trim() || null,
          status: 'em_andamento',
        })
        .select()
        .single()

      if (insertError || !servico) throw insertError ?? new Error('Erro ao criar serviço')

      const itens = flattenChecklistTemplate(servico.id)
      const { error: checklistError } = await supabase.from('checklist_items').insert(itens)
      if (checklistError) throw checklistError

      router.push(`/servicos/${servico.id}`)
    } catch (err: any) {
      setError(err.message ?? 'Erro inesperado')
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <button
          type="button"
          onClick={attemptExit}
          className="text-vobi-gray hover:text-vobi-dark transition-colors"
          aria-label="Voltar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-vobi-dark">Nova visita técnica</h1>
          <p className="text-vobi-gray text-sm mt-0.5">Revisão de ar-condicionado</p>
        </div>
      </div>

      <Card className="p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <h2 className="text-sm font-semibold text-vobi-dark mb-3">Cliente</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-vobi-dark mb-1.5">
                  Nome do cliente <span className="text-red-500">*</span>
                </label>
                <Input
                  name="cliente_nome"
                  placeholder="Ex: João Silva"
                  value={form.cliente_nome}
                  onChange={handleChange}
                  error={fieldErrors.cliente_nome}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-vobi-dark mb-1.5">
                  Endereço da visita <span className="text-red-500">*</span>
                </label>
                <Input
                  name="endereco"
                  placeholder="Rua, número, complemento, bairro"
                  value={form.endereco}
                  onChange={handleChange}
                  error={fieldErrors.endereco}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-vobi-dark mb-1.5">
                  Estado <span className="text-red-500">*</span>
                </label>
                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleEstadoChange}
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-white text-vobi-dark focus:outline-none focus:ring-2 focus:ring-vobi-primary/20 focus:border-vobi-primary transition-colors ${fieldErrors.estado ? 'border-red-400' : 'border-vobi-border'}`}
                >
                  <option value="">Selecione o estado</option>
                  {BRAZILIAN_STATES.map((s) => (
                    <option key={s.uf} value={s.uf}>{s.uf} — {s.nome}</option>
                  ))}
                </select>
                {fieldErrors.estado && <p className="mt-1 text-xs text-red-600">{fieldErrors.estado}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-vobi-dark mb-1.5">
                  Cidade <span className="text-red-500">*</span>
                </label>
                <select
                  name="cidade"
                  value={form.cidade}
                  onChange={handleChange}
                  disabled={!form.estado || loadingCidades}
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-white text-vobi-dark focus:outline-none focus:ring-2 focus:ring-vobi-primary/20 focus:border-vobi-primary transition-colors disabled:bg-vobi-cream disabled:text-vobi-gray-light ${fieldErrors.cidade ? 'border-red-400' : 'border-vobi-border'}`}
                >
                  <option value="">
                    {!form.estado ? 'Selecione o estado primeiro' : loadingCidades ? 'Carregando...' : 'Selecione a cidade'}
                  </option>
                  {cidades.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {fieldErrors.cidade && <p className="mt-1 text-xs text-red-600">{fieldErrors.cidade}</p>}
                {cidadesError && <p className="mt-1 text-xs text-red-600">{cidadesError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-vobi-dark mb-1.5">
                  E-mail do cliente
                  <span className="ml-1 text-vobi-gray-light font-normal text-xs">(para envio do resumo)</span>
                </label>
                <Input
                  type="email"
                  name="cliente_email"
                  placeholder="cliente@email.com"
                  value={form.cliente_email}
                  onChange={handleChange}
                  error={fieldErrors.cliente_email}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-vobi-dark mb-1.5">
                  Telefone
                  <span className="ml-1 text-vobi-gray-light font-normal text-xs">(opcional)</span>
                </label>
                <Input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  name="cliente_telefone"
                  placeholder="(11) 99999-9999"
                  value={form.cliente_telefone}
                  onChange={handleChange}
                  maxLength={15}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-vobi-border">
            <h2 className="text-sm font-semibold text-vobi-dark mb-3">Equipamento</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-vobi-dark mb-1.5">Tipo</label>
                <Input value="Ar-condicionado" readOnly className="bg-vobi-cream" />
              </div>

              <div>
                <label className="block text-sm font-medium text-vobi-dark mb-1.5">
                  Capacidade (BTUs) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  inputMode="numeric"
                  name="btus"
                  placeholder="Ex: 12000"
                  value={form.btus}
                  onChange={handleChange}
                  min={1}
                  step={1}
                  error={fieldErrors.btus}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-vobi-dark mb-1.5">
                  Nº de série
                  <span className="ml-1 text-vobi-gray-light font-normal text-xs">(opcional)</span>
                </label>
                <Input
                  name="numero_serie"
                  placeholder="Serial do equipamento"
                  value={form.numero_serie}
                  onChange={handleChange}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-vobi-dark mb-1.5">
                  Observação inicial
                  <span className="ml-1 text-vobi-gray-light font-normal text-xs">(opcional)</span>
                </label>
                <textarea
                  name="observacao_inicial"
                  placeholder="O que o cliente relatou ao abrir o chamado?"
                  value={form.observacao_inicial}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-vobi-border bg-white text-vobi-dark focus:outline-none focus:ring-2 focus:ring-vobi-primary/20 focus:border-vobi-primary transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 flex items-start gap-2">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 border-t border-vobi-border">
            <Button type="submit" loading={loading}>
              Iniciar visita
            </Button>
            <Button variant="secondary" type="button" onClick={attemptExit}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-4 p-4 bg-vobi-primary-light border border-vobi-primary-border rounded-xl">
        <p className="text-sm text-vobi-primary font-medium mb-1">Checklist padrão</p>
        <p className="text-xs text-vobi-primary/70">
          15 itens em 4 categorias: unidade interna, unidade externa, elétrica/operacional e gás/pressão.
        </p>
      </div>

      {confirmExit && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setConfirmExit(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-vobi-dark">Sair sem salvar?</h2>
                <p className="text-sm text-vobi-gray mt-1">
                  As informações preenchidas serão perdidas.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <Button variant="secondary" onClick={() => setConfirmExit(false)}>
                Continuar preenchendo
              </Button>
              <Button variant="danger" onClick={confirmAndExit}>
                Sair sem salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
