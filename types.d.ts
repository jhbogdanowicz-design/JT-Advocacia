/**
 * JT ADVOCACIA - DEFINIÇÕES DE TIPOS TYPESCRIPT
 * Este arquivo define as estruturas de dados para a estratégia jurídica gerada por IA
 * e o mapeamento das tabelas do banco de dados no Supabase.
 */

// 1. Tipagem para a Estratégia Jurídica Gerada por IA
export interface AcoesEtapa {
  teses_juridicas: string[];
  documentos_necessarios: string[];
  fundamentacao_legal: string[];
  riscos_e_alertas: string[];
  proximos_passos: string[];
}

export interface EtapaEstrategia {
  etapa: string; // Ex: "Fase Pré-Processual / Inicial", "Fase Inicial", "Fase Instrutória / Audiência"
  acoes: AcoesEtapa;
}

export interface EstrategiaIAResponse {
  estrategia_processual: EtapaEstrategia[];
}

// 2. Tipagem para os Modelos de Dados do Supabase

export interface Advogado {
  id: string; // UUID
  nome: string;
  email: string;
  oab?: string;
  tratamento?: string; // "Dr." ou "Dra."
  created_at: string; // ISO Timestamp
}

export interface Cliente {
  id: string; // UUID
  advogado_id: string; // FK -> Advogado
  nome: string;
  tipo_pessoa: "PF" | "PJ";
  cpf_cnpj?: string;
  data_nascimento_fundacao?: string; // Date (YYYY-MM-DD)
  estado_civil?: string;
  profissao_ramo?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  endereco_completo?: string;
  observacoes?: string;
  rg_ie?: string;
  areas_interesse?: string;
  processos_em_andamento?: string;
  tipo_assistencia?: string;
  renda_faturamento?: number;
  created_at: string;
}

export interface Processo {
  id: string; // UUID
  cliente_id: string; // FK -> Cliente
  numero_processo?: string; // Único, Padrão CNJ
  titulo: string;
  area_direito?: string;
  status: "Ativo" | "Suspenso" | "Arquivado" | "Em Acordo";
  tribunal?: string;
  vara?: string;
  valor_causa?: number;
  historico_andamentos?: AndamentoProcessual[];
  estrategia_ia?: EstrategiaIAResponse; // Coluna JSONB adicionada
  observacoes_internas?: string;
  created_at: string;
}

export interface AndamentoProcessual {
  data: string; // ISO Timestamp or Date string
  descricao: string;
  observacoes?: string;
}

export interface Compromisso {
  id: string; // UUID
  advogado_id: string; // FK -> Advogado
  cliente_id?: string; // FK -> Cliente (Opcional)
  processo_id?: string; // FK -> Processo (Opcional)
  titulo: string;
  tipo: "Audiência" | "Reunião" | "Prazo Processual" | "Atendimento";
  data_hora: string; // ISO Timestamp
  local_link?: string;
  status: "Agendado" | "Realizado" | "Cancelado";
  anotacoes_pos_evento?: string;
  created_at: string;
}

// 3. Estruturas para a Comunicação com a API de IA
export interface IAQueryRequest {
  dados_do_cliente: string;
}

export interface IAQueryResponse {
  estrategia_processual: EtapaEstrategia[];
  error?: string;
  details?: string;
}
