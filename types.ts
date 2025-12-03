
export interface AuthConfig {
  instanceName: string;
  apiKey: string;
  baseUrl: string;
}

export interface Contact {
  id: string; // O ID Canônico (Preferencialmente Phone JID)
  name: string;
  number: string;
  avatarUrl?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  timestampRaw?: number;
  // Campos de Unificação
  isGroup?: boolean;
  mergedIds?: string[]; // Lista de todos os IDs (LID, Phone) unificados neste contato
  sourceDevice?: 'ios' | 'android' | 'web' | 'unknown';
}

export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: Date;
  status: 'sending' | 'sent' | 'error' | 'read';
  fromUid?: string; // ID específico de quem enviou (pode ser o LID dentro da thread unificada)
}

export interface SendMessagePayload {
  number: string;
  text: string;
  delay?: number;
  linkPreview?: boolean;
}

// IDs atualizados conforme solicitação para o Kanban
export type DealStatus = 'novo' | 'conta_recebida' | 'orcamento_apresentado' | 'em_negociacao' | 'fechado' | 'perdido';

export interface Deal {
  id: string;
  title: string; // Responsável
  company: string; // Empresa (Preenchimento manual)
  tags: string[]; // Etiquetas (Ex: WhatsApp Lead, Quente, VIP)
  value: number; // Valor do Deal (Pode ser mantido ou usado como Valor Médio)
  status: DealStatus; // Etapa
  date: Date;
  contactId?: string; 
  avatarUrl?: string; 
  phone?: string; // Telefone
  
  // Novos Campos Solicitados
  email?: string;
  zipCode?: string; // CEP
  address?: string; // Endereço
  neighborhood?: string; // Bairro
  source?: string; // Origem
  averageBillValue?: number; // Valor médio da conta
  budgetPresented?: boolean; // Orçamento apresentado?
  notes?: string; // Observações
}
