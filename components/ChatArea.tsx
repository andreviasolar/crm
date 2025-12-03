
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Contact, Message, AuthConfig } from '../types';
import { Button, Input, Avatar } from './ui/Shared';
import { Send, Paperclip, Phone, Video, Info, Check, CheckCheck, Loader2, RefreshCcw, AlertCircle, ChevronLeft, Mic } from 'lucide-react';
import { sendMessage, fetchMessages, fetchProfilePictureUrl } from '../services/evolutionClient';
import toast from 'react-hot-toast';

interface ChatAreaProps {
  contact: Contact;
  config: AuthConfig;
  onToggleInfo: () => void;
  onBack?: () => void; // Optional for Desktop, required for Mobile logic
}

const ChatArea: React.FC<ChatAreaProps> = ({ contact, config, onToggleInfo, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(contact.avatarUrl);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update avatar when contact prop changes
  useEffect(() => {
    setCurrentAvatar(contact.avatarUrl);
    
    let isMounted = true;
    const refreshAvatar = async () => {
        const idToUse = contact.id && contact.id.includes('@') ? contact.id : contact.number;
        if (!idToUse) return;

        const url = await fetchProfilePictureUrl(config, idToUse);
        if (isMounted && url) {
            setCurrentAvatar(url);
        }
    };
    refreshAvatar();

    return () => { isMounted = false; };
  }, [contact, config]);

  const loadMessages = useCallback(async () => {
    if (!contact.id) return;
    
    setLoadingMessages(true);
    setError(false);
    setMessages([]); 
    
    try {
        // Fetch first page, 50 messages (mapped to 'offset' in API body)
        const history = await fetchMessages(config, contact.id, 1, 50);
        setMessages(history);
    } catch (e) {
        console.error("Failed to load messages:", e);
        setError(true);
        toast.error("Failed to load chat history");
    } finally {
        setLoadingMessages(false);
    }
  }, [contact.id, config]);

  // Initial load
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Auto scroll to bottom
  useEffect(() => {
    if (!loadingMessages) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingMessages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const tempId = Date.now().toString();
    const newMessage: Message = {
      id: tempId,
      text: inputValue,
      sender: 'me',
      timestamp: new Date(),
      status: 'sending'
    };

    // Optimistic Update
    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');

    try {
      await sendMessage(config, {
        number: contact.number,
        text: newMessage.text
      });

      // Update status on success
      setMessages((prev) => 
        prev.map(m => m.id === tempId ? { ...m, status: 'sent' } : m)
      );
    } catch (error) {
      // Update status on error
      setMessages((prev) => 
        prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m)
      );
      toast.error("Failed to send message.");
    }
  };

  return (
    <div className="flex flex-col h-full relative">
        {/* BACKGROUND LAYER - WhatsApp Beige with Doodle */}
        <div className="absolute inset-0 z-0 bg-[#efeae2] dark:bg-[#0b141a]">
             <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04] pointer-events-none" style={{
                backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                backgroundSize: '400px'
            }}></div>
        </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-[#f0f2f5] dark:bg-[#202c33] z-10 shadow-sm">
        <div className="flex items-center gap-1 md:gap-3">
          {/* Mobile Back Button */}
          <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-muted-foreground" onClick={onBack}>
             <ChevronLeft className="h-6 w-6" />
          </Button>

          <Avatar src={currentAvatar} alt={contact.name} fallback={contact.name} />
          <div className="flex-1 min-w-0 ml-2 cursor-pointer" onClick={onToggleInfo}>
            <h2 className="font-semibold text-sm md:text-base text-foreground truncate max-w-[150px] md:max-w-md">{contact.name}</h2>
            <p className="text-xs text-muted-foreground truncate">
                {contact.isGroup ? 'Group Info' : 'click for info'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[#54656f] dark:text-[#aebac1]">
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex rounded-full"><Video className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex rounded-full"><Phone className="h-5 w-5" /></Button>
            <div className="w-px h-6 bg-border mx-1"></div>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={loadMessages}><RefreshCcw className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onToggleInfo}><Info className="h-5 w-5" /></Button>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 z-10 scrollbar-thin scrollbar-thumb-border/40">
        {loadingMessages ? (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm">Decrypting messages...</span>
             </div>
        ) : error ? (
             <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                <AlertCircle className="h-10 w-10 text-destructive/50" />
                <div className="text-center">
                    <p className="font-medium">Failed to load chat history</p>
                    <p className="text-xs opacity-70">Check your connection or API status</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadMessages} className="gap-2">
                    <RefreshCcw className="h-3 w-3" /> Retry
                </Button>
             </div>
        ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                 <div className="bg-[#f0f2f5] dark:bg-[#1f2c34] p-4 rounded-xl text-center max-w-sm shadow-sm">
                    <span className="text-[#54656f] dark:text-[#8696a0] text-xs">
                        Messages are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
                    </span>
                 </div>
                 <div className="text-center opacity-60">
                     <span className="text-sm font-medium">No messages yet</span>
                 </div>
            </div>
        ) : (
            <>
                {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} mb-1`}>
                    <div className={`
                        max-w-[85%] sm:max-w-[65%] rounded-lg px-3 py-1.5 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative text-[14.2px] leading-[19px]
                        ${msg.sender === 'me' 
                            ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-none' 
                            : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-none'
                        }
                    `}>
                        {/* Triangle Tail Hack */}
                        <span className={`absolute top-0 w-3 h-3 ${msg.sender === 'me' ? '-right-2' : '-left-2'}`}>
                             <svg viewBox="0 0 8 13" height="13" width="8" className={`block w-full h-full fill-current ${msg.sender === 'me' ? 'text-[#d9fdd3] dark:text-[#005c4b]' : 'text-white dark:text-[#202c33]'}`} style={{ transform: msg.sender === 'me' ? 'none' : 'scaleX(-1)' }}>
                                <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"></path>
                             </svg>
                        </span>

                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        
                        <div className="flex items-center justify-end gap-1 mt-1 select-none float-right ml-2 -mb-1">
                            <span className={`text-[11px] ${msg.sender === 'me' ? 'text-[#111b21]/60 dark:text-[#e9edef]/60' : 'text-[#667781] dark:text-[#8696a0]'}`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {msg.sender === 'me' && (
                                <span className={msg.status === 'read' ? 'text-[#53bdeb]' : 'text-[#667781] dark:text-[#8696a0]'}>
                                    {msg.status === 'sending' && <span className="text-[10px]">...</span>}
                                    {msg.status === 'sent' && <Check className="w-3.5 h-3.5" />}
                                    {msg.status === 'read' && <CheckCheck className="w-3.5 h-3.5" />}
                                    {msg.status === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                ))}
                <div ref={messagesEndRef} />
            </>
        )}
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 bg-[#f0f2f5] dark:bg-[#202c33] z-10 safe-area-pb flex items-center gap-2">
         <Button variant="ghost" size="icon" className="text-[#54656f] dark:text-[#8696a0] hover:bg-transparent">
             <div className="text-xl">😊</div>
         </Button>
         <Button variant="ghost" size="icon" className="text-[#54656f] dark:text-[#8696a0] hover:bg-transparent -ml-2">
             <Paperclip className="h-5 w-5" />
         </Button>

        <form onSubmit={handleSend} className="flex-1 flex items-center gap-2">
            <Input 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message" 
                className="flex-1 rounded-lg border-none bg-white dark:bg-[#2a3942] focus-visible:ring-0 py-3 h-10 text-[15px] placeholder:text-[#54656f] dark:placeholder:text-[#8696a0]"
                disabled={loadingMessages || error}
            />
            {inputValue.trim() ? (
                 <Button type="submit" size="icon" className="shrink-0 rounded-full h-10 w-10 transition-transform duration-200 transform hover:scale-110" disabled={loadingMessages || error}>
                    <Send className="h-5 w-5 ml-0.5" />
                </Button>
            ) : (
                <Button type="button" size="icon" variant="ghost" className="shrink-0 text-[#54656f] dark:text-[#8696a0]">
                    <Mic className="h-6 w-6" />
                </Button>
            )}
        </form>
      </div>
    </div>
  );
};

export default ChatArea;
