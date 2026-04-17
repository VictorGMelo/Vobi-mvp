import Anthropic from '@anthropic-ai/sdk'
import type { Servico, ChecklistItemRow, StatusFinal } from '@/lib/types'

export const CLAUDE_MODEL = 'claude-haiku-4-5-20251001'

export function getAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY ausente')
  return new Anthropic({ apiKey })
}

function formatChecklist(itens: ChecklistItemRow[]): string {
  const grupos: Record<string, ChecklistItemRow[]> = {}
  const ordem: string[] = []
  for (const it of itens) {
    const g = it.grupo || 'Geral'
    if (!grupos[g]) {
      grupos[g] = []
      ordem.push(g)
    }
    grupos[g].push(it)
  }
  const lines: string[] = []
  for (const grupo of ordem) {
    lines.push(`\n[${grupo}]`)
    for (const it of grupos[grupo]) {
      const val = it.numeric_value !== null && it.numeric_value !== undefined ? ` (${it.numeric_value}${it.unit ?? ''})` : ''
      const obs = it.observacao ? ` — obs: ${it.observacao}` : ''
      lines.push(`- ${it.descricao}: ${it.status.toUpperCase()}${val}${obs}`)
    }
  }
  return lines.join('\n')
}

/**
 * Diagnóstico técnico (para o técnico). 2-3 linhas. PRD §12.
 */
export async function generateDiagnostico(params: {
  servico: Pick<Servico, 'btus' | 'tipo_equipamento' | 'observacao_inicial'>
  itens: ChecklistItemRow[]
}): Promise<string> {
  const { servico, itens } = params
  const anthropic = getAnthropic()

  const prompt = `Você é técnico sênior de manutenção de ar-condicionado (HVAC). Com base no checklist abaixo, escreva uma sugestão de diagnóstico técnico em 2 a 3 linhas, objetiva e prática, apontando a causa provável e a ação recomendada. Não invente dados. Se faltar informação, diga "dados insuficientes".

Equipamento: ${servico.tipo_equipamento}, ${servico.btus} BTUs
Relato do cliente: ${servico.observacao_inicial || 'não informado'}

Checklist:${formatChecklist(itens)}

Responda apenas o texto do diagnóstico, sem cabeçalho nem markdown.`

  const msg = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = msg.content[0]
  return block.type === 'text' ? block.text.trim() : ''
}

/**
 * Resumo em linguagem natural para o cliente leigo. PRD §13.
 */
export async function generateResumoNatural(params: {
  servico: Servico
  itens: ChecklistItemRow[]
}): Promise<string> {
  const { servico, itens } = params
  const anthropic = getAnthropic()

  const prompt = `Você está escrevendo para o cliente final (leigo em técnica) um resumo amigável e claro da visita de revisão do ar-condicionado. Em 1 a 2 parágrafos curtos, explique o que foi feito, o que está bem, o que precisou de ajuste e o que, se algo, exige atenção futura. Evite jargão técnico. Nunca invente informação.

Cliente: ${servico.cliente_nome}
Equipamento: ${servico.tipo_equipamento}, ${servico.btus} BTUs
Endereço: ${servico.endereco}${servico.cidade && servico.estado ? ` — ${servico.cidade}/${servico.estado}` : ''}

Checklist da visita:${formatChecklist(itens)}

Responda apenas o texto do resumo, sem cabeçalho nem markdown.`

  const msg = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = msg.content[0]
  return block.type === 'text' ? block.text.trim() : ''
}

export const STATUS_FINAL_NATURAL: Record<StatusFinal, string> = {
  ok: 'Serviço concluído sem intercorrências.',
  ajuste_realizado: 'Ajustes realizados durante a visita.',
  retorno_necessario: 'Retorno necessário — nova visita ou peça pendente.',
}
