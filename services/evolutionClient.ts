
import axios from 'axios';
import { AuthConfig, SendMessagePayload, Contact, Message } from '../types';

// Helper to sanitize URL
const cleanUrl = (url: string) => url.replace(/\/$/, '');

// HELPER: Validação Estrita de ID de Telefone
// Retorna o JID normalizado se for um número válido, ou null se for um LID/Inválido.
const resolveValidPhoneJid = (candidates: (string | undefined | null)[]): string | null => {
    // 1. Prioridade: Buscar explicitamente por sufixo de usuário padrão (@s.whatsapp.net)
    for (const id of candidates) {
        if (!id) continue;
        if (typeof id !== 'string') continue;
        
        // Se já vier formatado corretamente como usuário padrão
        if (id.includes('@s.whatsapp.net')) {
            return id;
        }
    }

    // 2. Tentativa de Recuperação: Verificar se é um número puro válido (ex: 5521999999999)
    // IGNORA explicitamente se contiver @lid ou @g.us nesta etapa
    for (const id of candidates) {
        if (!id) continue;
        if (typeof id !== 'string') continue;

        // Se for grupo, retornamos (será tratado pela UI como grupo)
        if (id.includes('@g.us')) return id;

        // Se for LID explicitamente, ignoramos nesta etapa para evitar o "número estranho"
        if (id.includes('@lid')) continue;

        // Limpeza: remove sufixos e caracteres não numéricos
        const cleanId = id.replace(/@.*/, '').replace(/\D/g, '');

        // Validação de formato BR e Internacional Básico
        if (cleanId.length >= 10 && cleanId.length <= 15) {
            return `${cleanId}@s.whatsapp.net`;
        }
    }

    return null;
};

// 1. POST /api/auth/setup
export const setupAuth = async (config: AuthConfig): Promise<boolean> => {
  try {
    const url = `${cleanUrl(config.baseUrl)}/instance/fetchInstances`;
    
    const response = await axios.get(url, {
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) return true;

    throw new Error('Invalid response from Evolution API');
  } catch (error: any) {
    console.error("Auth Setup Error:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to connect to Evolution API");
  }
};

// 2. POST /api/messages/send
export const sendMessage = async (config: AuthConfig, payload: SendMessagePayload): Promise<any> => {
  try {
    const url = `${cleanUrl(config.baseUrl)}/message/sendText/${config.instanceName}`;
    
    const cleanNumber = payload.number.replace(/@.*/, '');

    const body = {
      number: cleanNumber,
      text: payload.text,
      delay: payload.delay || 1200,
      linkPreview: payload.linkPreview || true
    };

    const response = await axios.post(url, body, {
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error: any) {
    console.error("Send Message Error:", error);
    throw error;
  }
};

// 3. POST /api/instance/connect
export const connectInstance = async (config: AuthConfig): Promise<any> => {
  try {
    const url = `${cleanUrl(config.baseUrl)}/instance/connect/${config.instanceName}`;
    
    const response = await axios.get(url, {
      headers: {
        'apikey': config.apiKey
      }
    });

    return response.data;
  } catch (error: any) {
    console.error("Connect Instance Error:", error);
    throw error;
  }
};

// 4. POST /chat/findChats/{instance} - REFATORADA PARA UNIFICAÇÃO ESTRITA
export const fetchChats = async (config: AuthConfig): Promise<Contact[]> => {
  try {
    const url = `${cleanUrl(config.baseUrl)}/chat/findChats/${config.instanceName}`;
    
    const response = await axios.post(url, { where: {} }, { 
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    const chatsRaw = Array.isArray(response.data) ? response.data : (response.data?.data || []);

    if (!Array.isArray(chatsRaw)) {
        return [];
    }

    // Mapa de Unificação: Chave = JID de Telefone Válido (@s.whatsapp.net)
    const contactMap = new Map<string, Contact>();

    chatsRaw.forEach((chat: any) => {
        // --- LÓGICA DE PURIFICAÇÃO DE ID ---
        // Coleta todos os candidatos possíveis para ID
        const idCandidates = [chat.remoteJidAlt, chat.remoteJid, chat.id];

        // Tenta resolver para um ID de telefone válido
        const canonicalJid = resolveValidPhoneJid(idCandidates);

        // SE NÃO FOR POSSÍVEL RESOLVER PARA UM NÚMERO DE TELEFONE VÁLIDO (OU GRUPO), IGNORAMOS O CHAT.
        if (!canonicalJid) {
            return; 
        }

        // --- Extração de Dados ---
        let lastMessageText = '...';
        const msgContent = chat.lastMessage?.message || chat.lastMessage;
        
        if (typeof chat.lastMessage === 'string') {
            lastMessageText = chat.lastMessage;
        } else if (msgContent) {
             lastMessageText = 
                msgContent.conversation || 
                msgContent.extendedTextMessage?.text || 
                (msgContent.imageMessage ? '📷 Foto' : null) ||
                (msgContent.audioMessage ? '🎤 Áudio' : null) ||
                (msgContent.videoMessage ? '🎥 Vídeo' : null) ||
                (msgContent.stickerMessage ? '👾 Figurine' : null) ||
                '...';
        }

        const timestampRaw = Number(chat.conversationTimestamp || chat.lastMessageTimestamp) || 0;
        const unreadCount = Number(chat.unreadCount) || 0;
        
        // --- UNIFICAÇÃO ---
        const existing = contactMap.get(canonicalJid);

        if (!existing) {
            // Nova entrada limpa
            const name = chat.pushName || chat.name || chat.verifiedName || canonicalJid.split('@')[0];
            
            contactMap.set(canonicalJid, {
                id: canonicalJid,
                name: name,
                number: canonicalJid.split('@')[0], 
                avatarUrl: chat.profilePictureUrl,
                lastMessage: lastMessageText,
                lastMessageTime: timestampRaw ? new Date(timestampRaw * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '',
                unreadCount: unreadCount,
                timestampRaw: timestampRaw,
                isGroup: canonicalJid.includes('@g.us'),
                mergedIds: [canonicalJid] // Rastreamento interno
            });
        } else {
            // MERGE: Se já existe um lead com este número de telefone
            const isNewer = timestampRaw > (existing.timestampRaw || 0);

            const updatedContact: Contact = {
                ...existing,
                unreadCount: Math.max(existing.unreadCount || 0, unreadCount), 
            };

            if (isNewer) {
                updatedContact.lastMessage = lastMessageText;
                updatedContact.timestampRaw = timestampRaw;
                updatedContact.lastMessageTime = timestampRaw ? new Date(timestampRaw * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : existing.lastMessageTime;
            }

            if (!existing.avatarUrl && chat.profilePictureUrl) {
                updatedContact.avatarUrl = chat.profilePictureUrl;
            }
            if ((!existing.name || existing.name === existing.number) && chat.pushName) {
                updatedContact.name = chat.pushName;
            }

            contactMap.set(canonicalJid, updatedContact);
        }
    });

    return Array.from(contactMap.values()).sort((a, b) => (b.timestampRaw || 0) - (a.timestampRaw || 0));

  } catch (error: any) {
    console.error("Fetch Chats Error:", error);
    return [];
  }
};

// 5. POST /chat/findMessages/{instance}
export const fetchMessages = async (
  config: AuthConfig, 
  contactId: string, 
  page: number = 1, 
  limit: number = 10
): Promise<Message[]> => {
  try {
    const url = `${cleanUrl(config.baseUrl)}/chat/findMessages/${config.instanceName}`;
    
    // UNIFICAÇÃO ROBUSTA NO FETCH DE MENSAGENS:
    // Garante que requests para contatos individuais usem sempre o JID de Telefone (@s.whatsapp.net),
    // ignorando LIDs ou formatações inconsistentes que possam vir da UI.
    let remoteJid = contactId;

    // Apenas aplicamos a limpeza se NÃO for um grupo ou newsletter
    if (contactId && !contactId.includes('@g.us') && !contactId.includes('@newsletter')) {
        const cleanNumbers = contactId.replace(/\D/g, '');
        // Validação simples: se tem números suficientes para ser um telefone, forçamos o padrão.
        if (cleanNumbers.length >= 10) {
            remoteJid = `${cleanNumbers}@s.whatsapp.net`;
        }
    }

    const body = {
        where: {
            key: {
                remoteJid: remoteJid
            }
        },
        page: page,
        offset: limit
    };
    
    const response = await axios.post(url, body, {
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    const rawData = response.data;
    let messagesArray: any[] = [];

    if (rawData?.messages?.records) messagesArray = rawData.messages.records;
    else if (rawData?.messages) messagesArray = rawData.messages;
    else if (Array.isArray(rawData)) messagesArray = rawData;
    else if (rawData?.data) messagesArray = rawData.data;

    return messagesArray.map((msg: any): Message => {
        const content = msg.message || {};
        const key = msg.key || {};
        
        const text = 
            content.conversation || 
            content.extendedTextMessage?.text || 
            content.imageMessage?.caption || 
            (content.imageMessage ? '📷 [Foto]' : null) ||
            (content.audioMessage ? '🎤 [Áudio]' : null) ||
            (content.videoMessage ? '🎥 [Vídeo]' : null) ||
            (content.stickerMessage ? '👾 [Sticker]' : null) ||
            (content.documentMessage ? `📄 [Arquivo] ${content.documentMessage.title || ''}` : null) ||
            (content.templateButtonReplyMessage ? content.templateButtonReplyMessage.selectedDisplayText : null) ||
            'Mensagem não suportada';

        const isMe = key.fromMe === true;
        
        let ts = msg.messageTimestamp;
        if (typeof ts === 'object' && ts?.low) ts = ts.low;
        if (ts && ts < 10000000000) ts = ts * 1000;

        let statusStr = msg.status;
        if (!statusStr && msg.MessageUpdate?.length > 0) {
            statusStr = msg.MessageUpdate[msg.MessageUpdate.length - 1].status;
        }

        let normalizedStatus: 'sending' | 'sent' | 'error' | 'read' = isMe ? 'sent' : 'read';
        
        if (statusStr) {
            const lower = statusStr.toLowerCase();
            if (lower === 'error') normalizedStatus = 'error';
            else if (lower.includes('read') || lower === 'played') normalizedStatus = 'read';
            else if (lower.includes('ack') || lower.includes('delivery')) normalizedStatus = 'sent';
            else if (lower === 'pending') normalizedStatus = 'sending';
        }

        return {
            id: key.id || Math.random().toString(),
            text: typeof text === 'string' ? text : String(text || ''),
            sender: isMe ? 'me' : 'them',
            timestamp: new Date(Number(ts) || Date.now()),
            status: normalizedStatus,
            fromUid: key.remoteJid 
        };
    }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); 

  } catch (error: any) {
    console.error("[FetchMessages] Error:", error);
    throw error;
  }
};

// 6. POST /chat/fetchProfilePictureUrl/{instance}
export const fetchProfilePictureUrl = async (config: AuthConfig, numberOrJid: string): Promise<string | undefined> => {
    try {
        const url = `${cleanUrl(config.baseUrl)}/chat/fetchProfilePictureUrl/${config.instanceName}`;
        
        const response = await axios.post(url, { number: numberOrJid }, {
            headers: {
                'apikey': config.apiKey,
                'Content-Type': 'application/json'
            }
        });
        return response.data?.profilePictureUrl;
    } catch (error) {
        return undefined;
    }
};
