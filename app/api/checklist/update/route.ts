import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

const VALID_STATUS = new Set(['pendente', 'ok', 'ajustado', 'problema'])

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status, observacao, numeric_value } = body

    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verifica dono + serviço não finalizado
    const { data: item } = await supabase
      .from('checklist_items')
      .select('id, servicos!inner(user_id, status)')
      .eq('id', id)
      .single()

    const servico = (item as any)?.servicos
    if (!item || servico?.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (servico.status === 'finalizado') {
      return NextResponse.json({ error: 'Serviço finalizado (read-only)' }, { status: 409 })
    }

    const updates: Record<string, any> = {}
    if (status !== undefined) {
      if (!VALID_STATUS.has(status)) {
        return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
      }
      updates.status = status
    }
    if (observacao !== undefined) updates.observacao = observacao
    if (numeric_value !== undefined) updates.numeric_value = numeric_value

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true })
    }

    const { error } = await supabase.from('checklist_items').update(updates).eq('id', id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
