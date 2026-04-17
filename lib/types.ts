export type ServicoStatus = 'em_andamento' | 'finalizado'
export type StatusFinal = 'ok' | 'ajuste_realizado' | 'retorno_necessario'
export type ChecklistItemStatus = 'pendente' | 'ok' | 'ajustado' | 'problema'
export type ChecklistItemKind = 'boolean' | 'numeric'

export interface Servico {
  id: string
  user_id: string

  cliente_nome: string
  cliente_email: string | null
  cliente_telefone: string | null
  endereco: string
  cidade: string | null
  estado: string | null

  tipo_equipamento: string
  btus: number
  numero_serie: string | null
  observacao_inicial: string | null

  status: ServicoStatus
  status_final: StatusFinal | null
  finalizado_em: string | null

  diagnostico_ia: string | null
  resumo_ia: string | null

  public_token: string | null

  email_enviado_em: string | null
  email_erro: string | null

  created_at: string
  updated_at: string
}

export interface ChecklistItemRow {
  id: string
  servico_id: string
  grupo: string
  descricao: string
  orientacao: string | null
  kind: ChecklistItemKind
  unit: string | null
  numeric_value: number | null
  status: ChecklistItemStatus
  observacao: string | null
  ordem: number
  created_at: string
}

export interface ServicePhoto {
  id: string
  servico_id: string
  user_id: string
  storage_path: string
  public_url: string
  mime_type: string | null
  size_bytes: number | null
  ordem: number
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  company: string | null
  email: string | null
  created_at: string
}

export const STATUS_FINAL_LABEL: Record<StatusFinal, string> = {
  ok: 'OK',
  ajuste_realizado: 'Ajuste Realizado',
  retorno_necessario: 'Retorno Necessário',
}

export const CHECKLIST_STATUS_LABEL: Record<ChecklistItemStatus, string> = {
  pendente: 'Pendente',
  ok: 'OK',
  ajustado: 'Ajustado',
  problema: 'Problema',
}
