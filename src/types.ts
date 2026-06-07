/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserPerfil {
  CITIZEN = "Cidadão",
  ADMIN = "Administrador Geral",
  OUVIDORIA = "Ouvidoria de Câmara",
  VEREADOR = "Vereador Específico",
  AUDITORIA = "Auditoria",
  PROCURADOR = "Procurador da Câmara"
}

export enum ManifestacaoTipo {
  RECLAMACAO = "Reclamação",
  SUGESTAO = "Sugestão",
  DENUNCIA = "Denúncia",
  ELOGIO = "Elogio"
}

export enum ManifestacaoStatus {
  RECEBIDO = "Recebido",
  EM_ANALISE = "Em Análise",
  ENCAMINHADO = "Encaminhado para Vereador",
  LIDO = "Lido (Aguardando Resposta)",
  RESPONDIDO = "Respondido",
  FINALIZADO = "Finalizado"
}

export enum ManifestacaoPrioridade {
  BAIXA = "Baixa",
  MEDIA = "Média",
  ALTA = "Alta",
  URGENTE = "Urgente"
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  senhaHash: string;
  perfil: UserPerfil;
  criadoPorAdminId?: string;
  bairro?: string;
  endereco?: string;
  cpf?: string;
  loginProvisorio?: boolean;
  criadoEm: string;
  emailAlternativo?: string; // Email alternativo obrigatório para agentes (não cidadãos) como prova de envio
}

export interface Secretaria {
  id: string;
  nome: string;
  email: string;
  responsavelNome: string;
}

export interface Manifestacao {
  id: string;
  protocolo: string;
  tipo: ManifestacaoTipo;
  descricao: string;
  status: ManifestacaoStatus;
  prioridade: ManifestacaoPrioridade;
  categoria: string;
  secretariaId?: string;
  vereadorId?: string; // Specific Vereador ID, "todos", or "ouvidoria"
  usuarioId?: string;
  usuarioNome?: string;
  usuarioEmail?: string;
  usuarioTelefone?: string;
  bairro: string;
  localizacao?: {
    latitude: number;
    longitude: number;
    bairro?: string;
  };
  fotoUrl?: string; // Base64 or standard URL mockup
  criadoEm: string;
  lidoEm?: string; // For 30 days responsive SLA counter
  respondidoEm?: string;
  respostaMsg?: string;
  respostaSugeridaIA?: string;
  observacaoResolvido?: string; // Observação sobre a resolução do vereador/ouvidoria
  encaminhadoPara?: string; // Para quem encaminhou (órgão, secretaria, assessor, etc)
  origem?: string; // e.g. "Cidadão Comum", "Órgão Público", "Prefeito(a) Municipal", "Secretário(a) Municipal", "Vereador(a) / Gabinete"
  destacada?: boolean; // Highlighted filter alert flag
  servidorResponsavelId?: string;
  servidorResponsavelNome?: string;
  vereadorResponsavelId?: string;
  vereadorResponsavelNome?: string;
  historicoLogs: string[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  usuarioEmail: string;
  usuarioNome: string;
  acao: string;
  protocoloRef?: string;
  ipAddress?: string;
}

export interface HeaderConfig {
  municipioNome: string;
  nomePrograma: string;
  logoUrl: string;
  backgroundColor: string;
  textColor: string;
  welcomeGreeting?: string;
  appSubTitle?: string;
}
