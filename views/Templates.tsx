
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ResponseTemplate } from '../types';
import { store } from '../services/store';
import { Button, Badge } from '../components/UI';
import { toast } from '../components/DesignSystem';
import { Copy, Search, Check, Book, ArrowRight, AlertCircle, Crown, Zap } from 'lucide-react';
import { setRouteState } from '@/lib/route-state';

export const Templates: React.FC = () => {
    const router = useRouter();
    const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchTemplates = async () => {
            setLoading(true);
            setErrorMsg(null);
            try {
                const data = await store.getTemplates();
                setTemplates(data);
                if (data.length === 0) {
                    console.warn("Fetched 0 templates. Check DB RLS policies.");
                }
            } catch (error: any) {
                console.error("Failed to load templates", error);
                setErrorMsg(error.message || "Failed to load templates.");
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast("Template text copied.", "success");
    };

    const handleUseTemplate = (t: ResponseTemplate) => {
        setRouteState('/', { templateText: t.content, opponentType: t.opponentType });
        router.push('/');
    };

    const filtered = templates.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.opponentType.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col w-full h-full animate-fade-in pb-20 md:pb-0 px-6 md:px-10">
             <div className="pt-10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-100 mb-2">Template Library</h1>
                    <p className="text-slate-300 text-sm">Select a common conflict scenario to pre-fill your case file.</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search scenarios..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        className="w-full bg-navy-900 border border-navy-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-gold-500/50 outline-none transition-all" 
                    />
                </div>
             </div>

             {loading ? (
                <div className="flex-1 flex items-center justify-center text-slate-500 animate-pulse">Loading library...</div>
             ) : errorMsg ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
                    <AlertCircle className="w-12 h-12 mb-4 text-rose-500 opacity-80" />
                    <p className="text-rose-400 font-bold mb-2">Connection Error</p>
                    <p className="text-sm text-slate-500">{errorMsg}</p>
                </div>
             ) : filtered.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
                    <Book className="w-12 h-12 mb-4 opacity-20" />
                    <p>No matching templates found.</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                    {filtered.map(t => (
                        <div key={t.id} className="bg-navy-900 border border-navy-800 hover:border-gold-500/30 rounded-xl p-6 transition-all group flex flex-col h-full hover:shadow-lg hover:shadow-black/20">
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-2 w-full">
                                    <h3 className="font-bold text-slate-100 text-base leading-tight">{t.title}</h3>
                                    <div className="flex flex-wrap gap-2 items-center justify-between w-full">
                                        <span className="text-[10px] uppercase font-bold text-gold-500 bg-gold-500/10 border border-gold-500/20 px-2 py-0.5 rounded">{t.opponentType}</span>
                                        {t.recommendedPlan === 'premium' ? (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                                <Crown className="w-3 h-3" /> Premium
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                                <Zap className="w-3 h-3" /> Standard
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <p className="text-sm text-slate-300 leading-relaxed bg-navy-950/50 p-4 rounded-lg border border-navy-800/50 flex-1 mb-6 font-sans">
                                {t.content}
                            </p>

                            <div className="flex gap-3 mt-auto">
                                 <button 
                                    onClick={() => handleCopy(t.content, t.id)} 
                                    className="px-4 py-2 rounded-lg bg-navy-950 text-slate-400 hover:text-white hover:bg-navy-800 transition-colors border border-navy-800 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                                 >
                                    {copiedId === t.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span className="hidden sm:inline">Copy</span>
                                 </button>
                                 <Button 
                                    onClick={() => handleUseTemplate(t)} 
                                    className={`flex-1 gap-2 ${t.recommendedPlan === 'premium' ? 'bg-navy-800 hover:bg-gold-600 hover:text-navy-950' : 'bg-navy-800 hover:bg-blue-600 hover:text-white'} border-navy-700`}
                                    size="sm"
                                 >
                                    <span>Use Template</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                 </Button>
                            </div>
                        </div>
                    ))}
                </div>
             )}
        </div>
    );
};
