
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Deal, DealStatus, Contact, AuthConfig, Message } from '../types';
import { Card, Button, Avatar, Input } from './ui/Shared';
import { DollarSign, Calendar, Building2, MoreHorizontal, MessageCircle, Menu, Sun, Pencil, X, Save, MapPin, Mail, Tag, Loader2, Check, CheckCheck, AlertCircle, Search, Hash } from 'lucide-react';
import { fetchProfilePictureUrl, fetchMessages } from '../services/evolutionClient';
import toast from 'react-hot-toast';

interface SalesKanbanProps {
  contacts: Contact[];
  onOpenMenu?: () => void;
  config: AuthConfig;
}

// Etiquetas Disponíveis
const AVAILABLE_TAGS = [
    "WhatsApp Lead",
    "🔥 Quente",
    "❄️ Frio",
    "⚠️ Urgente",
    "💎 VIP",
    "⏳ Aguardando Cliente",
    "📞 Tentar Novamente",
    "📅 Reunião Agendada",
    "🤝 Indicação",
    "🚫 Desqualificado",
    "💬 Prefere WhatsApp"
];

// Helper para cor da tag
const getTagColor = (tag: string) => {
    if (tag.includes('Quente') || tag.includes('Urgente')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800';
    if (tag.includes('Frio')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    if (tag.includes('VIP')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    if (tag.includes('WhatsApp')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800';
    if (tag.includes('Desqualificado')) return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
};

// Definição das Colunas
const COLUMNS: { id: DealStatus; title: string; color: string; bg: string; border: string }[] = [
  { 
    id: 'novo', 
    title: 'NOVO CONTATO', 
    color: 'text-[#00a884]', 
    bg: 'bg-[#f0f2f5] dark:bg-[#202c33]', 
    border: 'border-transparent' 
  },
  { 
    id: 'conta_recebida', 
    title: 'CONTA RECEBIDA', 
    color: 'text-blue-500', 
    bg: 'bg-[#f0f2f5] dark:bg-[#202c33]', 
    border: 'border-transparent' 
  },
  { 
    id: 'orcamento_apresentado', 
    title: 'ORÇAMENTO APRESENTADO', 
    color: 'text-orange-500', 
    bg: 'bg-[#f0f2f5] dark:bg-[#202c33]', 
    border: 'border-transparent' 
  },
  { 
    id: 'em_negociacao', 
    title: 'EM NEGOCIAÇÃO', 
    color: 'text-purple-500', 
    bg: 'bg-[#f0f2f5] dark:bg-[#202c33]', 
    border: 'border-transparent' 
  },
  { 
    id: 'fechado', 
    title: 'FECHADO', 
    color: 'text-[#25D366]', 
    bg: 'bg-[#f0f2f5] dark:bg-[#202c33]', 
    border: 'border-transparent' 
  },
  { 
    id: 'perdido', 
    title: 'PEDIDO / NÃO APRESENTADO', 
    color: 'text-red-500', 
    bg: 'bg-[#f0f2f5] dark:bg-[#202c33]', 
    border: 'border-transparent' 
  },
];

// Helper functions
const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
const formatDate = (date: Date) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);

// --- COMPONENTE MODAL DE VISUALIZAÇÃO DE CHAT ---
const ChatViewerModal = ({ lead, config, onClose }: { lead: Deal, config: AuthConfig, onClose: () => void }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadHistory = async () => {
            setLoading(true);
            try {
                // LÓGICA DE UNIFICAÇÃO NO POP-UP:
                let targetJid = lead.contactId;

                // Se houver telefone, normaliza para garantir formato @s.whatsapp.net
                if (lead.phone) {
                    const cleanPhone = lead.phone.replace(/\D/g, '');
                    if (cleanPhone.length >= 10) {
                        targetJid = `${cleanPhone}@s.whatsapp.net`;
                    }
                }

                if (!targetJid) {
                    targetJid = lead.contactId || '';
                }
                
                if (targetJid) {
                    const data = await fetchMessages(config, targetJid, 1, 20);
                    setMessages(data);
                }
            } catch (error) {
                console.error(error);
                toast.error("Erro ao carregar conversas");
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, [lead, config]);

    // Scroll to bottom on load
    useEffect(() => {
        if (!loading) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loading]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#efeae2] dark:bg-[#0b141a] rounded-xl w-full max-w-lg h-[80vh] flex flex-col overflow-hidden shadow-2xl relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04] pointer-events-none z-0" style={{
                        backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                        backgroundSize: '400px'
                }}></div>

                {/* Header */}
                <div className="flex items-center justify-between p-3 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-border z-10">
                    <div className="flex items-center gap-3">
                        <Avatar src={lead.avatarUrl} alt={lead.title} fallback={lead.title} />
                        <div>
                            <h3 className="font-bold text-sm text-[#111b21] dark:text-[#e9edef]">{lead.title}</h3>
                            <p className="text-xs text-[#667781] dark:text-[#8696a0]">{lead.phone}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-[#54656f]">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 z-10 scrollbar-thin scrollbar-thumb-border/40">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-[#00a884]" />
                            <span className="text-xs text-[#667781]">Buscando mensagens...</span>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-xs text-[#667781] opacity-60">
                            Nenhuma mensagem encontrada recentemente.
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} mb-1`}>
                                <div className={`
                                    max-w-[85%] rounded-lg px-3 py-1.5 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative text-[14.2px] leading-[19px]
                                    ${msg.sender === 'me' 
                                        ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-none' 
                                        : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-none'
                                    }
                                `}>
                                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                    <div className="flex items-center justify-end gap-1 mt-1 select-none float-right ml-2 -mb-1">
                                        <span className={`text-[11px] ${msg.sender === 'me' ? 'text-[#111b21]/60 dark:text-[#e9edef]/60' : 'text-[#667781] dark:text-[#8696a0]'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {msg.sender === 'me' && (
                                            <span className={msg.status === 'read' ? 'text-[#53bdeb]' : 'text-[#667781] dark:text-[#8696a0]'}>
                                                {msg.status === 'sent' && <Check className="w-3.5 h-3.5" />}
                                                {msg.status === 'read' && <CheckCheck className="w-3.5 h-3.5" />}
                                                {msg.status === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE MODAL DE EDIÇÃO ---
const EditLeadModal = ({ lead, onClose, onSave }: { lead: Deal, onClose: () => void, onSave: (updatedLead: Deal) => void }) => {
    const [formData, setFormData] = useState<Deal>({ 
        ...lead,
        tags: lead.tags || [] 
    });
    const [loadingCep, setLoadingCep] = useState(false);

    const handleChange = (field: keyof Deal, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, ''); // Remove caracteres não numéricos
        handleChange('zipCode', rawValue);

        if (rawValue.length === 8) {
            setLoadingCep(true);
            try {
                // Utilizando GET conforme padrão da ViaCEP
                const response = await axios.get(`https://viacep.com.br/ws/${rawValue}/json/`);
                
                if (response.data && !response.data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        address: response.data.logradouro,
                        neighborhood: response.data.bairro,
                        // Você pode concatenar a cidade/UF no endereço se desejar, mas vamos preencher os campos mapeados
                        // Se quiser salvar Cidade/UF, teria que adicionar esses campos ao tipo Deal
                    }));
                    toast.success("Endereço localizado!");
                } else {
                    toast.error("CEP não encontrado.");
                }
            } catch (error) {
                console.error("Erro ao buscar CEP:", error);
                toast.error("Erro ao consultar CEP.");
            } finally {
                setLoadingCep(false);
            }
        }
    };

    const toggleTag = (tag: string) => {
        setFormData(prev => {
            const currentTags = prev.tags || [];
            if (currentTags.includes(tag)) {
                return { ...prev, tags: currentTags.filter(t => t !== tag) };
            } else {
                return { ...prev, tags: [...currentTags, tag] };
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#202c33] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-[#111b21] dark:text-[#e9edef] flex items-center gap-2">
                        <Pencil className="w-5 h-5 text-[#00a884]" />
                        Editar Lead
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-[#54656f]">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    
                    {/* Linha 1: Responsável e Telefone (Dados fixos do contato) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[#54656f] dark:text-[#8696a0] uppercase">Responsável</label>
                            <Input 
                                value={formData.title} 
                                onChange={(e) => handleChange('title', e.target.value)} 
                                placeholder="Nome do contato"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[#54656f] dark:text-[#8696a0] uppercase">Telefone</label>
                            <Input 
                                value={formData.phone || ''} 
                                onChange={(e) => handleChange('phone', e.target.value)} 
                                placeholder="55..."
                            />
                        </div>
                    </div>

                    {/* SEÇÃO DE ETIQUETAS (TAGS) */}
                    <div className="space-y-2 border p-3 rounded-lg border-dashed border-border/60 bg-[#f9f9fa] dark:bg-[#111b21]/50">
                        <label className="text-xs font-semibold text-[#54656f] dark:text-[#8696a0] uppercase flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5" />
                            Etiquetas
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_TAGS.map(tag => {
                                const isSelected = formData.tags?.includes(tag);
                                return (
                                    <button
                                        type="button"
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        className={`
                                            px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200
                                            ${isSelected 
                                                ? `${getTagColor(tag)} ring-1 ring-offset-1 ring-offset-white dark:ring-offset-[#202c33] ring-current shadow-sm` 
                                                : 'bg-white dark:bg-[#2a3942] text-[#54656f] dark:text-[#8696a0] border-transparent hover:border-border hover:bg-gray-50 dark:hover:bg-[#111b21]'
                                            }
                                        `}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Linha 2: Empresa e Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[#54656f] dark:text-[#8696a0] uppercase">Empresa (Manual)</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    className="pl-9" 
                                    value={formData.company} 
                                    onChange={(e) => handleChange('company', e.target.value)} 
                                    placeholder="Preencha o nome da empresa..."
                                />
                            </div>
                        </div>
                         <div className="space-y-1">
                            <label className="text-xs font-semibold text-[#54656f] dark:text-[#8696a0] uppercase">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    className="pl-9"
                                    value={formData.email || ''} 
                                    onChange={(e) => handleChange('email', e.target.value)} 
                                    placeholder="email@exemplo.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Linha 3: CEP e Endereço */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div className="space-y-1 md:col-span-1">
                            <label className="text-xs font-semibold text-[#54656f] dark:text-[#8696a0] uppercase">CEP</label>
                            <div className="relative">
                                <div className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground flex items-center justify-center">
                                    {loadingCep ? <Loader2 className="h-3 w-3 animate-spin" /> : <Hash className="h-3 w-3" />}
                                </div>
                                <Input 
                                    className="pl-9"
                                    value={formData.zipCode || ''} 
                                    onChange={handleCepChange} 
                                    placeholder="00000000"
                                    maxLength={8}
                                />
                            </div>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-semibold text-[#54656f] dark:text-[#8696a0] uppercase">Endereço</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    className="pl-9"
                                    value={formData.address || ''} 
                                    onChange={(e) => handleChange('address', e.target.value)} 
                                    placeholder="Rua, Número..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Linha 4: Bairro e Origem (Moved Neighborhood to own row or combined) */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-xs font-semibold text-[#54656f] dark:text-[#8696a0] uppercase">Bairro</label>
                            <Input 
                                value={formData.neighborhood || ''} 
                                onChange={(e) => handleChange('neighborhood', e.target.value)} 
                                placeholder="Bairro"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[#54656f] dark:text-[#8696a0] uppercase">Origem</label>
                             <div className="relative">
                                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    className="pl-9"
                                    value={formData.source || ''} 
                                    onChange={(e) => handleChange('source', e.target.value)} 
                                    placeholder="Ex: WhatsApp, Indicação..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Linha 5: Etapa e Valor Médio */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[#54656f] dark:text-[#8696a0] uppercase">Etapa</label>
                            <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                            >
                                {COLUMNS.map(col => (
                                    <option key={col.id} value={col.id}>{col.title}</option>
                                ))}
                            </select>
                        </div>
                         <div className="space-y-1">
                            <label className="text-xs font-semibold text-[#54656f] dark:text-[#8696a0] uppercase">Valor Médio da Conta</label>
                             <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    className="pl-9"
                                    type="number"
                                    value={formData.averageBillValue || 0} 
                                    onChange={(e) => handleChange('averageBillValue', Number(e.target.value))} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Linha 6: Checkbox Orçamento */}
                     <div className="flex items-center gap-2 pt-2">
                        <input 
                            type="checkbox" 
                            id="budgetPresented"
                            className="w-5 h-5 accent-[#00a884] rounded border-gray-300"
                            checked={formData.budgetPresented || false}
                            onChange={(e) => handleChange('budgetPresented', e.target.checked)}
                        />
                        <label htmlFor="budgetPresented" className="text-sm font-medium text-[#111b21] dark:text-[#e9edef]">Orçamento Apresentado?</label>
                    </div>

                    {/* Linha 7: Observações */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#54656f] dark:text-[#8696a0] uppercase">Observações</label>
                        <textarea 
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.notes || ''}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="Detalhes adicionais sobre o lead..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" className="bg-[#00a884] hover:bg-[#008f6f] text-white gap-2">
                            <Save className="w-4 h-4" />
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// Sub-componente para o Card
interface KanbanCardProps {
    lead: Deal;
    config: AuthConfig;
    onDragStart: (e: React.DragEvent, id: string) => void;
    draggedLeadId: string | null;
    onEdit: (lead: Deal) => void;
    onViewChat: (lead: Deal) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ 
    lead, 
    config, 
    onDragStart, 
    draggedLeadId,
    onEdit,
    onViewChat
}) => {
    const [avatar, setAvatar] = useState<string | undefined>(lead.avatarUrl);

    useEffect(() => {
        let isMounted = true;
        if (!avatar && config && lead.phone) {
             const timeout = setTimeout(() => {
                 fetchProfilePictureUrl(config, lead.phone as string)
                    .then(url => {
                        if (isMounted && url) {
                            setAvatar(url);
                        }
                    })
                    .catch(() => {});
             }, Math.random() * 800);
             return () => clearTimeout(timeout);
        }
        return () => { isMounted = false; };
    }, [lead.phone, config, avatar]);

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, lead.id)}
            className={`
            bg-white dark:bg-[#202c33] p-3 rounded-lg shadow-sm border-l-4 border-l-[#00a884] cursor-grab active:cursor-grabbing
            hover:shadow-md transition-all duration-200 group relative flex flex-col gap-2
            ${draggedLeadId === lead.id ? 'opacity-40 scale-[0.98]' : ''}
            `}
        >
            {/* Ações (Hover ou Mobile) */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                 {/* Botão Ver Chat */}
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 rounded-full bg-[#25D366] text-white hover:bg-[#128c7e] shadow-sm"
                    title="Ver Conversa"
                    onClick={(e) => {
                        e.stopPropagation(); 
                        onViewChat(lead);
                    }}
                >
                    <MessageCircle className="w-3.5 h-3.5" />
                </Button>

                {/* Botão Editar */}
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 rounded-full bg-[#f0f2f5] dark:bg-[#111b21] hover:bg-[#d9fdd3] dark:hover:bg-[#005c4b] text-[#54656f] dark:text-[#aebac1] shadow-sm"
                    title="Editar Lead"
                    onClick={(e) => {
                        e.stopPropagation(); 
                        onEdit(lead);
                    }}
                >
                    <Pencil className="w-3.5 h-3.5" />
                </Button>
            </div>

            {/* Header do Card com Avatar e Telefone */}
            <div className="flex items-start gap-3">
                <Avatar src={avatar} alt={lead.title} fallback={lead.title} className="h-12 w-12" />
                <div className="flex-1 min-w-0 pr-10">
                    <h4 className="font-bold text-sm text-[#111b21] dark:text-[#e9edef] leading-tight truncate">{lead.title}</h4>
                    <p className="text-xs text-[#667781] dark:text-[#8696a0] mb-1 font-mono">{lead.phone}</p>
                    
                    {/* Renderização de Etiquetas (Tags) */}
                    <div className="flex flex-wrap gap-1 mt-1">
                        {lead.tags?.slice(0, 3).map(tag => (
                            <span 
                                key={tag} 
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1 border ${getTagColor(tag)}`}
                            >
                                {tag}
                            </span>
                        ))}
                        {lead.tags && lead.tags.length > 3 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                                +{lead.tags.length - 3}
                            </span>
                        )}
                    </div>
                    
                    {/* Renderização da Empresa se existir */}
                    {lead.company && lead.company !== 'WhatsApp Lead' && (
                         <div className="flex items-center gap-1 mt-1 text-[10px] text-[#54656f] dark:text-[#aebac1]">
                            <Building2 className="w-2.5 h-2.5" />
                            <span className="truncate">{lead.company}</span>
                         </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/20 mt-1">
                <span className="text-sm font-bold text-[#00a884]">
                    {/* Exibindo Valor Médio da Conta se houver, senão valor do deal */}
                    {formatCurrency(lead.averageBillValue || lead.value)}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-[#8696a0]" title={lead.date.toLocaleDateString()}>
                    <Calendar className="w-3 h-3" />
                    {formatDate(lead.date)}
                </div>
            </div>
        </div>
    );
};

const SalesKanban: React.FC<SalesKanbanProps> = ({ contacts, onOpenMenu, config }) => {
  const [leads, setLeads] = useState<Deal[]>([]);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [editingLead, setEditingLead] = useState<Deal | null>(null);
  const [viewingChatLead, setViewingChatLead] = useState<Deal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!contacts || contacts.length === 0) return;

    setLeads((currentLeads) => {
      const existingIds = new Set(currentLeads.filter(l => l.contactId).map(l => l.contactId));
      const existingPhones = new Set(
          currentLeads
            .filter(l => l.phone)
            .map(l => l.phone!.replace(/\D/g, ''))
      );
      
      const newLeadsFromContacts: Deal[] = contacts
        .filter(c => {
            const cleanNum = c.number.replace(/\D/g, '');
            // Só adiciona se não existe o ID nem o Telefone
            return !existingIds.has(c.id) && !existingPhones.has(cleanNum);
        })
        .map(c => ({
          id: `lead_${c.id}`,
          title: c.name,
          company: '', // Inicia vazio conforme solicitado
          tags: ['WhatsApp Lead'], // Etiqueta padrão
          value: 0, 
          status: 'novo', 
          date: new Date(c.timestampRaw ? c.timestampRaw * 1000 : Date.now()),
          contactId: c.id,
          avatarUrl: c.avatarUrl,
          phone: c.number
        }));

      return newLeadsFromContacts.length > 0 ? [...currentLeads, ...newLeadsFromContacts] : currentLeads;
    });
  }, [contacts]);

  // Filtragem de Leads
  const filteredLeads = leads.filter(lead => {
    const term = searchTerm.toLowerCase();
    return (
        lead.title.toLowerCase().includes(term) ||
        (lead.phone && lead.phone.includes(term)) ||
        (lead.company && lead.company.toLowerCase().includes(term)) ||
        (lead.email && lead.email.toLowerCase().includes(term)) ||
        (lead.tags && lead.tags.some(t => t.toLowerCase().includes(term)))
    );
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLeadId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: DealStatus) => {
    e.preventDefault();
    if (!draggedLeadId) return;

    // 1. Encontrar o lead sendo movido ANTES da atualização
    const leadToMove = leads.find(l => l.id === draggedLeadId);

    if (leadToMove) {
        // 2. Criar objeto atualizado
        const updatedLead = { ...leadToMove, status: targetStatus };

        // 3. Atualização Otimista da UI
        setLeads((prev) => 
            prev.map((lead) => 
                lead.id === draggedLeadId ? updatedLead : lead
            )
        );
        
        const newStatusName = COLUMNS.find(c => c.id === targetStatus)?.title;
        toast.success(`Lead movido para: ${newStatusName}`, { icon: '👏' });

        // 4. Disparar Webhook com TODOS os dados
        axios.post('https://webhook.viasolar.rio.br/webhook/log-crm-whatsapp', {
            ...updatedLead,
            event: 'card_movement',
            timestamp: new Date().toISOString(),
            previousStatus: leadToMove.status
        }).catch(err => {
            console.error("Erro ao enviar log de movimento:", err);
        });
    }

    setDraggedLeadId(null);
  };

  const handleSaveLead = (updatedLead: Deal) => {
      setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
      setEditingLead(null);
      toast.success("Lead atualizado com sucesso!");
  };

  return (
    <div className="h-full flex flex-col bg-[#efeae2] dark:bg-[#0b141a] overflow-hidden font-sans relative">
       {/* Doodle Background */}
       <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04] pointer-events-none z-0" style={{
            backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
            backgroundSize: '400px'
       }}></div>

      {/* MODAL DE EDIÇÃO */}
      {editingLead && (
          <EditLeadModal 
            lead={editingLead} 
            onClose={() => setEditingLead(null)} 
            onSave={handleSaveLead} 
          />
      )}

      {/* MODAL DE VISUALIZAÇÃO DE CHAT */}
      {viewingChatLead && (
          <ChatViewerModal 
             lead={viewingChatLead}
             config={config}
             onClose={() => setViewingChatLead(null)}
          />
      )}

      {/* Header da Ferramenta */}
      <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-b border-border bg-[#f0f2f5] dark:bg-[#202c33] shadow-sm z-10 gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-[#54656f] dark:text-[#aebac1]" onClick={onOpenMenu}>
             <Menu className="h-6 w-6" />
          </Button>
          
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 text-[#111b21] dark:text-[#e9edef]">
              <Sun className="h-6 w-6 text-[#00a884]" />
              CRM VIA SOLAR
            </h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-[#54656f] dark:text-[#8696a0]" />
            </div>
            <Input 
                className="pl-10 bg-white dark:bg-[#111b21] border-none shadow-sm h-10 w-full" 
                placeholder="Buscar por nome, tag, telefone..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* Área do Board Kanban - RESPONSIVA E PERCENTUAL */}
      <div className="flex-1 overflow-auto p-6 z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 w-full h-full"> 
          
          {COLUMNS.map((col) => {
            // Filtrando leads baseado na busca
            const columnLeads = filteredLeads.filter(lead => lead.status === col.id);
            // Soma do Valor Médio da Conta, ou 0 se nulo
            const totalValue = columnLeads.reduce((acc, curr) => acc + (curr.averageBillValue || curr.value), 0);

            return (
              <div 
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`flex flex-col rounded-xl transition-colors duration-200 h-[600px] xl:h-full`}
              >
                {/* Cabeçalho da Coluna com Totais */}
                <div className={`p-3 rounded-t-xl border-b-2 border-[#00a884]/20 ${col.bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-bold text-sm uppercase tracking-wider flex items-center gap-2 ${col.color}`}>
                      {col.title}
                    </h3>
                    <span className="bg-[#d9fdd3] dark:bg-[#005c4b] text-[#00a884] dark:text-[#e9edef] text-xs font-bold px-2 py-0.5 rounded-full">
                      {columnLeads.length}
                    </span>
                  </div>
                  
                  {/* Card de Valor Total */}
                  <div className="text-xs font-medium text-[#54656f] dark:text-[#8696a0]">
                     Total: <span className="text-[#111b21] dark:text-[#e9edef]">{formatCurrency(totalValue)}</span>
                  </div>
                </div>

                {/* Lista de Cards (Área Droppable) */}
                <div className={`flex-1 p-2 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-border/50 bg-white/30 dark:bg-black/20 rounded-b-xl`}>
                  {columnLeads.map((lead) => (
                    <KanbanCard 
                        key={lead.id} 
                        lead={lead} 
                        config={config} 
                        onDragStart={handleDragStart} 
                        draggedLeadId={draggedLeadId}
                        onEdit={(l) => setEditingLead(l)}
                        onViewChat={(l) => setViewingChatLead(l)}
                    />
                  ))}
                  
                  {columnLeads.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-20 text-[#8696a0] text-xs opacity-50 border-2 border-dashed border-border/30 rounded-lg">
                        {searchTerm ? 'Nenhum lead encontrado' : 'Arraste leads aqui'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SalesKanban;
