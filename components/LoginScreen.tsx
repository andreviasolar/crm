
import React, { useState } from 'react';
import { AuthConfig } from '../types';
import { setupAuth } from '../services/evolutionClient';
import { Button, Input } from './ui/Shared';
import { MessageSquare, Server, Key, Globe, Loader2, Moon, Sun, ChevronRight, User, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../index';

interface LoginScreenProps {
  onLoginSuccess: (config: AuthConfig) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AuthConfig>({
    instanceName: '',
    apiKey: '',
    baseUrl: 'https://apiia.viasolar.rio.br' // URL padrão definida e oculta no form
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.instanceName || !formData.apiKey || !formData.baseUrl) {
      toast.error("Preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      await setupAuth(formData);
      toast.success("Conectado com sucesso!");
      onLoginSuccess(formData);
    } catch (error: any) {
      toast.error(`Falha na conexão: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#f0f2f5] dark:bg-black font-sans selection:bg-green-500/30 transition-colors duration-500">
        {/* Background Image with Theme Aware Overlay */}
        <div 
            className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700 scale-105"
            style={{ 
                backgroundImage: "url('https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=2000&auto=format&fit=crop')",
            }}
        >
            {/* Gradient Overlay: White/Green for Light Mode, Black/Green for Dark Mode */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-100/60 via-white/80 to-white/90 dark:from-green-900/40 dark:via-black/70 dark:to-black/90 backdrop-blur-[1px] transition-colors duration-500"></div>
        </div>

        {/* Floating Theme Toggle */}
        <div className="absolute top-6 right-6 z-20">
            <button 
                onClick={toggleTheme} 
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/40 dark:bg-white/10 backdrop-blur-md border border-black/5 dark:border-white/20 text-gray-800 dark:text-white shadow-lg transition-transform hover:scale-110 active:scale-95 hover:bg-white/60 dark:hover:bg-white/20"
            >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
        </div>

        {/* Main Card */}
        <div className="relative z-10 w-full max-w-[420px] p-4 animate-in fade-in zoom-in duration-500 slide-in-from-bottom-4">
            <div className="overflow-hidden rounded-3xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 transition-colors duration-500">
                
                {/* Header */}
                <div className="relative flex flex-col items-center justify-center pt-10 pb-6 px-8 text-center">
                    <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-green-500/20 to-transparent opacity-50 blur-xl"></div>
                    
                    <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-green-500 to-emerald-700 shadow-lg shadow-green-500/20 group hover:scale-105 transition-transform duration-300">
                        <MessageSquare className="h-10 w-10 text-white group-hover:rotate-3 transition-transform duration-300" />
                    </div>
                    
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white drop-shadow-sm transition-colors">CRM VIA SOLAR</h1>
                    <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors">
                        Gerencie suas conversas com inteligência.
                    </p>
                </div>

                {/* Form */}
                <div className="px-8 pb-10">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            <div className="group relative">
                                <div className="absolute left-3 top-3.5 text-gray-500 dark:text-gray-400 transition-colors group-focus-within:text-green-600 dark:group-focus-within:text-green-400 z-10">
                                    <Server className="h-5 w-5" />
                                </div>
                                <Input 
                                    name="instanceName" 
                                    placeholder="Usuário" 
                                    value={formData.instanceName} 
                                    onChange={handleChange}
                                    className="h-12 pl-11 !rounded-xl border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-500 focus:border-green-500/50 focus:ring-green-500/20 transition-all hover:bg-white/50 dark:hover:bg-white/10"
                                />
                            </div>

                            {/* URL Field Hidden but logic remains */}

                            <div className="group relative">
                                <div className="absolute left-3 top-3.5 text-gray-500 dark:text-gray-400 transition-colors group-focus-within:text-green-600 dark:group-focus-within:text-green-400 z-10">
                                    <Key className="h-5 w-5" />
                                </div>
                                <Input 
                                    name="apiKey" 
                                    type="password" 
                                    placeholder="Senha" 
                                    value={formData.apiKey} 
                                    onChange={handleChange} 
                                    className="h-12 pl-11 !rounded-xl border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-500 focus:border-green-500/50 focus:ring-green-500/20 transition-all hover:bg-white/50 dark:hover:bg-white/10"
                                />
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-base font-bold text-white shadow-lg shadow-green-900/20 hover:from-green-500 hover:to-emerald-500 hover:shadow-green-500/30 transition-all duration-300 transform active:scale-[0.98] border-none"
                        >
                            {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Conectando...
                            </div>
                            ) : (
                            <div className="flex items-center justify-center gap-2">
                                Acessar Painel <ChevronRight className="h-5 w-5" />
                            </div>
                            )}
                        </Button>
                    </form>
                    
                    <p className="mt-8 text-center text-[10px] text-gray-500 dark:text-gray-600">
                        &copy; {new Date().getFullYear()} Via Solar. v2.4
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default LoginScreen;
