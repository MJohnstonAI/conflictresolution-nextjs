
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Case, UserAccount } from '../types';
import { store } from '../services/store';
import { supabase } from '../services/supabase';
import { exportService } from '../services/export';
import { Button, Badge } from '../components/UI';
import { Skeleton, DropdownMenu, AlertDialog, toast } from '../components/DesignSystem';
import { Archive, Search, Trash2, Printer, MoreVertical, FileText, AlertCircle } from 'lucide-react';

export const Vault: React.FC = () => {
    const router = useRouter();
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [account, setAccount] = useState<UserAccount>({ premiumSessions: 0, standardSessions: 0, totalCasesCreated: 0, isAdmin: false, role: 'demo' });
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [authState, setAuthState] = useState<'loading' | 'signed_out' | 'signed_in' | 'error'>('loading');
  
    const fetchData = async () => {
        setLoading(true);
        setSyncError(null);
        setAuthState('loading');
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError) {
                setAuthState('error');
                setLoading(false);
                return;
            }
            if (!user) {
                setAuthState('signed_out');
                setLoading(false);
                return;
            }
            setAuthState('signed_in');
            const [fetchedCases, fetchedAccount] = await Promise.all([
                store.getCases(),
                store.getAccount()
            ]);
            setCases(fetchedCases);
            setAccount(fetchedAccount);
            
            // If the role is still 'pending', something went wrong with the trigger
            if (fetchedAccount.role === 'pending') {
                setSyncError("Couldn't connect. Retry.");
            }
        } catch (e) {
            console.error("Vault Data Sync Error:", e);
            setSyncError("Couldn't connect. Retry.");
            toast("Couldn't connect. Retry.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Create a mapping for sequential case numbers based on chronological order
    const caseNumberMap = useMemo(() => {
        const sortedAsc = [...cases].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const map = new Map<string, number>();
        sortedAsc.forEach((c, idx) => map.set(c.id, idx + 1));
        return map;
    }, [cases]);

    const confirmDelete = async () => {
        if (!deleteId) return;
        await store.deleteCase(deleteId);
        setCases(prev => prev.filter(c => c.id !== deleteId));
        toast("Case deleted successfully.", "success");
        setDeleteId(null);
    };


    const handleExportMarkdown = async (c: Case) => {
        toast("Generating markdown file...", "info");
        try {
            const rounds = await store.getRounds(c.id);
            exportService.downloadMarkdown(c, rounds);
            toast("Download started.", "success");
        } catch (error) {
            console.error("Markdown export failed:", error);
            toast("Couldn't sync case file. Retry.", "error");
        }
    };

    const handleExportPDF = async (c: Case) => {
        toast("Preparing document...", "info");
        try {
            const rounds = await store.getRounds(c.id);
            exportService.printToPDF(c, rounds);
        } catch (error) {
            console.error("PDF export failed:", error);
            toast("Couldn't sync case file. Retry.", "error");
        }
    };
  
    const filteredCases = cases.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.opponentType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
    if (authState === 'signed_out') {
        return (
            <div className="flex flex-col w-full h-full animate-fade-in pb-20 md:pb-0 px-6 md:px-10">
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 min-h-[400px] gap-4">
                    <Archive className="w-12 h-12 opacity-30" />
                    <div className="text-center space-y-2">
                        <p className="text-sm font-semibold text-slate-100">Sign in to access your vault.</p>
                        <p className="text-xs text-slate-400">Demo cases are available in Demo Mode.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button onClick={() => router.push('/auth')} className="bg-gold-600 text-navy-950 font-bold">Sign In / Join</Button>
                        <Button variant="ghost" onClick={() => router.push('/demo')} className="text-blue-300">Try Demo Mode</Button>
                    </div>
                </div>
            </div>
        );
    }

    if (authState === 'error') {
        return (
            <div className="flex flex-col w-full h-full animate-fade-in pb-20 md:pb-0 px-6 md:px-10">
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 min-h-[400px] gap-4">
                    <AlertCircle className="w-12 h-12 text-rose-400" />
                    <div className="text-center space-y-2">
                        <p className="text-sm font-semibold text-slate-100">Couldn't connect. Retry.</p>
                        <p className="text-xs text-slate-400">Check your connection and try again.</p>
                    </div>
                    <Button onClick={fetchData} className="bg-navy-900 border border-navy-700 text-slate-200">Retry</Button>
                </div>
            </div>
        );
    }

    return (
      <div className="flex flex-col w-full h-full animate-fade-in pb-20 md:pb-0 px-6 md:px-10">
        
        {syncError && authState === 'signed_in' && (
            <div className="mt-6 bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    <div>
                        <p className="text-sm font-bold text-slate-100">Connection Issue</p>
                        <p className="text-xs text-slate-400">{syncError}</p>
                    </div>
                </div>
                <button onClick={fetchData} className="px-3 py-1.5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-600 transition-all">
                    Retry
                </button>
            </div>
        )}


        <div className="pt-10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-100 mb-2">Case Vault</h1>
            <div className="flex items-center gap-4">
                <p className="text-slate-300 text-sm flex items-center gap-1">
                    <Archive className="w-4 h-4 text-gold-500" />
                    Total Historical Cases: <span className="text-gold-500 font-bold">{cases.length}</span>
                </p>
            </div>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
                type="text" 
                placeholder="Search by title or opponent..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full bg-navy-900 border border-navy-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-gold-500/50 outline-none" 
            />
          </div>
        </div>
        
        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="rounded-xl bg-navy-900 border border-navy-800 p-5 flex flex-col h-[220px]">
                   <div className="flex gap-2 mb-4">
                     <Skeleton className="w-24 h-5 rounded-md" /> 
                     <Skeleton className="w-16 h-5 rounded-md" />
                   </div>
                   <Skeleton className="w-3/4 h-6 mb-2 rounded-md" />
                   <div className="space-y-2 mb-6 flex-1">
                     <Skeleton className="w-full h-3 rounded" />
                     <Skeleton className="w-2/3 h-3 rounded" />
                   </div>
                   <div className="pt-3 border-t border-navy-800 space-y-2 mt-auto">
                     <div className="flex justify-between">
                       <Skeleton className="w-12 h-3 rounded" />
                       <Skeleton className="w-20 h-3 rounded" />
                     </div>
                     <Skeleton className="w-full h-1.5 rounded-full" />
                   </div>
                </div>
              ))}
            </div>
        ) : filteredCases.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
            <Archive className="w-12 h-12 mb-4 opacity-20" />
            <p>{searchQuery ? "No matching cases found in your vault." : "Your vault is currently empty."}</p>
          <Button variant="ghost" onClick={() => router.push('/')} className="mt-4 text-gold-500">Create New Case</Button>
        </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {filteredCases.map(c => {
                const caseNum = caseNumberMap.get(c.id) || 0;
                const roundsLogged = Math.max(0, c.roundsUsed);
                const progressPercentage = roundsLogged > 0 ? 100 : 0;
                
                return (
                   <div key={c.id} onClick={() => router.push(`/case/${c.id}`)} className={`group bg-navy-900 border rounded-2xl p-6 relative overflow-visible transition-all hover:shadow-2xl hover:shadow-black/40 cursor-pointer ${c.planType === 'premium' ? 'border-gold-500/20 hover:border-gold-500/60 bg-gradient-to-br from-navy-900 to-navy-950' : 'border-navy-800 hover:border-navy-700'}`}>
                      <div className="absolute top-6 right-6 z-20" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu 
                             trigger={<button className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-navy-800 transition-colors"><MoreVertical className="w-4 h-4" /></button>}
                             items={[
                               { label: "Export Markdown", icon: FileText, onClick: () => handleExportMarkdown(c) },
                               { label: "Print / PDF", icon: Printer, onClick: () => handleExportPDF(c) },
                               { label: "Delete Case", icon: Trash2, onClick: () => setDeleteId(c.id), variant: 'danger' }
                             ]}
                          />
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mb-4 pr-8">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy-950 text-slate-400 uppercase tracking-widest border border-navy-800">
                            {c.opponentType}
                        </span>
                        {c.planType === 'premium' ? <Badge color="amber">Professional</Badge> : <Badge color="blue">Standard</Badge>}
                      </div>

                      <h3 className="font-serif font-bold text-lg text-slate-100 mb-2 group-hover:text-gold-400 transition-colors truncate pr-4">
                        {c.title}
                      </h3>
                      
                      <p className="text-xs text-slate-400 line-clamp-2 mb-8 min-h-[3em] leading-relaxed">
                        {c.note || "No specific context provided for this case file."}
                      </p>

                      <div className="mt-auto space-y-3">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded bg-navy-950 border border-navy-800 flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-gold-500">{caseNum}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-100 uppercase tracking-widest font-mono">
                                        CASE {caseNum}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                                        ROUNDS LOGGED <span className="text-slate-300">{roundsLogged}</span>
                                    </span>
                                </div>
                            </div>
                            
                            <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden border border-navy-800 shadow-inner">
                                <div 
                                    className={`h-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(0,0,0,0.5)] ${c.planType === 'premium' ? 'bg-gradient-to-r from-gold-600 to-gold-400' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`} 
                                    style={{width: `${progressPercentage}%`}} 
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider px-0.5">
                            <span>Started</span>
                            <span className="font-mono text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                   </div>
                );
            })}
          </div>
        )}
        
        <AlertDialog 
           open={!!deleteId} 
           onOpenChange={(val) => !val && setDeleteId(null)}
           title="Permanent Deletion"
           description="This action will permanently delete the entire case history, analysis, and drafted responses. This cannot be undone."
           actionLabel="Delete Case"
           variant="danger"
           onAction={confirmDelete}
        />
      </div>
    );
};
