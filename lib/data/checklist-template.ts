// Checklist de revisão de ar-condicionado split — PRD §8
// Cada item aceita OK / Ajustado / Problema. Itens "Problema" exigem observação.
// Itens "numeric" têm um valor medido (temperatura, pressão) além do status.

import type { ChecklistItemKind } from '@/lib/types'

export interface ChecklistTemplateItem {
  descricao: string
  orientacao?: string
  kind?: ChecklistItemKind
  unit?: string
}

export interface ChecklistTemplateGroup {
  grupo: string
  itens: ChecklistTemplateItem[]
}

export const CHECKLIST_AC: ChecklistTemplateGroup[] = [
  {
    grupo: 'Unidade interna (evaporadora)',
    itens: [
      { descricao: 'Filtros de ar — limpeza e estado', orientacao: 'Inspecionar, limpar ou indicar substituição' },
      { descricao: 'Serpentina — sujeira/oxidação', orientacao: 'Verificar estado da serpentina interna' },
      { descricao: 'Dreno de condensado — vazamento e desobstrução', orientacao: 'Testar escoamento e vedação' },
      { descricao: 'Ruído de funcionamento', orientacao: 'Ouvir rangidos, batidas ou chiados' },
      { descricao: 'Controle remoto / termostato', orientacao: 'Verificar resposta e funções' },
    ],
  },
  {
    grupo: 'Unidade externa (condensadora)',
    itens: [
      { descricao: 'Serpentina externa — sujeira e aletas', orientacao: 'Limpar e alinhar aletas se necessário' },
      { descricao: 'Hélice / ventilador — fixação e ruído', orientacao: 'Verificar fixação e equilíbrio' },
      { descricao: 'Fixação do suporte na parede', orientacao: 'Verificar parafusos, vibração e estrutura' },
      { descricao: 'Isolamento das tubulações', orientacao: 'Conferir integridade da espuma de isolamento' },
    ],
  },
  {
    grupo: 'Elétrica e operacional',
    itens: [
      {
        descricao: 'Temperatura de saída do ar frio',
        orientacao: 'Medir com termômetro — esperado entre 8°C e 14°C',
        kind: 'numeric',
        unit: '°C',
      },
      { descricao: 'Disjuntor dedicado e aterramento', orientacao: 'Confirmar disjuntor dimensionado e aterramento' },
      { descricao: 'Tempo de resposta ao acionamento', orientacao: 'Liga em até 3 segundos e estabiliza em 1 minuto' },
    ],
  },
  {
    grupo: 'Gás e pressão',
    itens: [
      {
        descricao: 'Pressão de alta',
        orientacao: 'Medir com manifold — comparar com tabela do refrigerante',
        kind: 'numeric',
        unit: 'psi',
      },
      {
        descricao: 'Pressão de baixa',
        orientacao: 'Medir com manifold — comparar com tabela do refrigerante',
        kind: 'numeric',
        unit: 'psi',
      },
      { descricao: 'Indícios de vazamento de gás', orientacao: 'Inspecionar conexões com detector ou espuma' },
    ],
  },
]

export function flattenChecklistTemplate(servicoId: string) {
  return CHECKLIST_AC.flatMap((grupo, gi) =>
    grupo.itens.map((item, ii) => ({
      servico_id: servicoId,
      grupo: grupo.grupo,
      descricao: item.descricao,
      orientacao: item.orientacao ?? null,
      kind: item.kind ?? 'boolean',
      unit: item.unit ?? null,
      status: 'pendente' as const,
      ordem: gi * 10 + ii + 1,
    }))
  )
}
