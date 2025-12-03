
import React, { useState, useEffect } from 'react';
import { AuthConfig, Contact } from '../types';
import { fetchChats } from '../services/evolutionClient';
import SalesKanban from './SalesKanban';
import { Loader2, MessageSquare, Kanban, Settings, LogOut, Moon, Sun, X, Wallet } from 'lucide-react';
import { Button } from './ui/Shared';
import { useTheme } from '../index';
import toast from 'react-hot-toast';

interface ChatDashboardProps {
  config: AuthConfig;
  onLogout: () => void;
}

const ChatDashboard: React.FC<ChatDashboardProps> = ({ config, onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize data (Contacts are still fetched to populate Leads if needed)
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchChats(config);
        setContacts(data);
      } catch (e: any) {
        console.error(e);
        toast.error(`Failed to load data: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [config]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#111b21]">
        <div className="flex flex-col items-center gap-4">
             <div className="h-16 w-16 text-[#00a884] animate-pulse">
                <Sun className="w-full h-full" />
             </div>
             <Loader2 className="h-6 w-6 animate-spin text-[#00a884]" />
             <p className="text-[#e9edef] text-sm font-medium">Carregando CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      
      {/* MOBILE OVERLAY BACKDROP */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
            onClick={closeMobileMenu}
        />
      )}

      {/* NAVIGATION RAIL (SIDEBAR) */}
      <div className={`
            fixed md:relative z-50 h-full w-[60px] bg-[#f0f2f5] dark:bg-[#202c33] border-r border-border flex flex-col items-center py-4 gap-4 transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
         <div className="mb-2 flex flex-col items-center gap-2">
            <div className="h-10 w-10 bg-transparent rounded-xl flex items-center justify-center text-[#00a884]">
                <Sun className="h-8 w-8 fill-current" />
            </div>
            {/* Close button for mobile menu only */}
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 text-[#54656f] dark:text-[#aebac1]" onClick={closeMobileMenu}>
                <X className="h-5 w-5" />
            </Button>
         </div>
         
         <div className="flex flex-col w-full gap-3 px-2 mt-4">
             <div className="relative group w-full flex justify-center">
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full h-10 w-10 bg-[#d9fdd3] dark:bg-[#005c4b] text-[#00a884] dark:text-[#00a884]"
                    title="CRM Kanban"
                    onClick={closeMobileMenu}
                 >
                    <Kanban className="h-5 w-5" strokeWidth={2.5} />
                 </Button>
             </div>
         </div>

         <div className="mt-auto flex flex-col gap-3 px-2 w-full pb-2">
            <Button 
                variant="ghost" 
                size="icon" 
                className="w-full rounded-full text-[#54656f] dark:text-[#aebac1]" 
                onClick={toggleTheme}
                title={theme === 'dark' ? "Mudar para Claro" : "Mudar para Escuro"}
            >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="w-full rounded-full text-[#54656f] dark:text-[#aebac1]" title="Configurações">
                <Settings className="h-5 w-5" />
            </Button>
            <div className="w-8 h-8 rounded-full overflow-hidden mx-auto mt-2 cursor-pointer hover:opacity-80 transition-opacity" title="Perfil">
                 <img src="https://github.com/shadcn.png" alt="Profile" />
            </div>
            <Button variant="ghost" size="icon" className="w-full rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={onLogout} title="Sair">
                <LogOut className="h-5 w-5" />
            </Button>
         </div>
      </div>

      {/* Main Content Area - Full CRM View */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-[#efeae2] dark:bg-[#0b141a]">
        <SalesKanban 
            contacts={contacts} 
            onOpenMenu={() => setIsMobileMenuOpen(true)}
            config={config}
        />
      </div>
    </div>
  );
};

export default ChatDashboard;
