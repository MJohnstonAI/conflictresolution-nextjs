
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { store } from '../services/store';
import { simulatePurchase, BILLING_PRODUCT_IDS } from '../services/billing';
import { Button, Badge } from '../components/UI';
import { toast } from '../components/DesignSystem';
import { Zap, Crown, CheckCircle2, ArrowLeft, BrainCircuit, FileText, Sparkles, Briefcase } from 'lucide-react';
import { UserAccount } from '../types';

export const UnlockCase: React.FC = () => {
  const router = useRouter();
  const [account, setAccount] = useState<UserAccount>({ premiumSessions: 0, standardSessions: 0, totalCasesCreated: 0, isAdmin: false, role: 'demo' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    store.getAccount().then(setAccount);
  }, []);

  const handleBuySessions = async (qty: number, productId: string, type: 'standard' | 'premium') => {
    setLoading(true);
    const result = await simulatePurchase(productId as any);

    if (result.success) {
      await store.addSessions(type, qty);
      const updated = await store.getAccount();
      setAccount(updated);
      toast(`Successfully added ${qty} ${type === 'premium' ? 'Premium' : 'Standard'} Session(s)!`, "success");
    } else {
      toast("Purchase failed: " + result.error, "error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-navy-950 p-6 flex flex-col items-center animate-fade-in w-full overflow-y-auto">
      <div className="w-full max-w-7xl space-y-8 pb-10">
        
        <div className="flex flex-col items-center justify-center pt-8 space-y-4">
           <Badge color="gray">Sessions Store</Badge>
           <h1 className="text-3xl font-serif font-bold text-slate-100 text-center">Power Your Disputes</h1>
           <p className="text-sm text-slate-300 max-w-lg mx-auto text-center leading-relaxed">
             Purchase <strong>Sessions</strong> to unlock strategic guidance and draft responses.
           </p>
           <p className="text-[11px] text-slate-400 max-w-lg mx-auto text-center">
             1 Session generates strategy + mediation-style guidance + draft responses for one round.
           </p>
        </div>

        {/* Wallet Status */}
        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto w-full">
            <div className="bg-navy-900/50 border border-blue-500/20 rounded-2xl p-6 text-center space-y-2">
                <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Standard Sessions</p>
                <div className="flex items-center justify-center gap-3">
                    <FileText className="w-6 h-6 text-slate-400" />
                    <span className="text-3xl font-bold text-slate-100">{account.standardSessions}</span>
                </div>
            </div>
            <div className="bg-navy-900/50 border border-gold-500/20 rounded-2xl p-6 text-center space-y-2">
                <p className="text-xs font-bold text-gold-500 uppercase tracking-widest">Premium Sessions</p>
                <div className="flex items-center justify-center gap-3">
                    <Crown className="w-6 h-6 text-slate-400" />
                    <span className="text-3xl font-bold text-slate-100">{account.premiumSessions}</span>
                </div>
            </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto pt-6">
           
           {/* STANDARD OPTION */}
           <div className="bg-navy-900 border border-navy-800 hover:border-blue-500/50 transition-colors rounded-xl p-6 flex flex-col h-full relative group shadow-lg">
              <div className="mb-4">
                 <h3 className="font-bold text-lg text-slate-100">Standard Sessions</h3>
                 <p className="text-xs text-blue-400 uppercase tracking-wider">Quick Disputes</p>
              </div>
              <div className="text-3xl font-serif font-bold text-slate-100 mb-6">$4.99</div>
              
              <ul className="space-y-3 mb-8 flex-1">
                 <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 className="w-4 h-4 text-blue-500" /> 10 Sessions</li>
                 <li className="flex items-center gap-2 text-sm text-slate-300"><Zap className="w-4 h-4 text-blue-500" /> Fast Analysis</li>
                 <li className="flex items-center gap-2 text-sm text-slate-300"><FileText className="w-4 h-4 text-blue-500" /> Use across any cases/rounds</li>
              </ul>

              <Button fullWidth onClick={() => handleBuySessions(10, BILLING_PRODUCT_IDS.STANDARD_SESSIONS_10, 'standard')} disabled={loading} className="bg-blue-600 text-white hover:bg-blue-500 font-bold border-none">Buy 10 Sessions</Button>
           </div>

           {/* PREMIUM SINGLE */}
           <div className="bg-navy-900 border border-navy-800 hover:border-gold-500/30 transition-colors rounded-xl p-6 flex flex-col h-full relative group">
              <div className="mb-4">
                 <h3 className="font-bold text-lg text-slate-100">Premium Sessions</h3>
                 <p className="text-xs text-gold-500 uppercase tracking-wider">Professional</p>
              </div>
              <div className="text-3xl font-serif font-bold text-gold-400 mb-6">$14.99</div>
              
              <ul className="space-y-3 mb-8 flex-1">
                 <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 className="w-4 h-4 text-gold-500" /> 40 Sessions</li>
                 <li className="flex items-center gap-2 text-sm text-slate-300"><BrainCircuit className="w-4 h-4 text-gold-500" /> Expert Analysis</li>
                 <li className="flex items-center gap-2 text-sm text-slate-300"><Crown className="w-4 h-4 text-gold-500" /> Use across any cases/rounds</li>
              </ul>

              <Button fullWidth onClick={() => handleBuySessions(40, BILLING_PRODUCT_IDS.PREMIUM_SESSIONS_40, 'premium')} disabled={loading} className="bg-navy-800 text-white hover:bg-navy-700">Buy 40 Sessions</Button>
           </div>
           
           {/* PREMIUM PACK */}
           <div className="bg-gradient-to-br from-navy-800 to-navy-900 border border-gold-500 rounded-xl p-6 flex flex-col h-full relative group transform md:-translate-y-2 shadow-2xl shadow-gold-500/10">
              <div className="absolute top-0 right-0 bg-gold-500 text-navy-950 text-[10px] font-bold px-2 py-1 rounded-bl-lg">POPULAR</div>
              <div className="mb-4">
                 <h3 className="font-bold text-lg text-slate-100">Power Pack</h3>
                 <p className="text-xs text-slate-400 uppercase tracking-wider">Active Users</p>
              </div>
              <div className="text-3xl font-serif font-bold text-gold-400 mb-6">$39.99</div>
              
              <ul className="space-y-3 mb-8 flex-1">
                 <li className="flex items-center gap-2 text-sm text-slate-100"><CheckCircle2 className="w-4 h-4 text-gold-500" /> 120 Sessions</li>
                 <li className="flex items-center gap-2 text-sm text-slate-100"><BrainCircuit className="w-4 h-4 text-gold-500" /> Expert Analysis</li>
                 <li className="flex items-center gap-2 text-sm text-slate-100"><Crown className="w-4 h-4 text-gold-500" /> Sessions across any cases</li>
                 <li className="flex items-center gap-2 text-sm text-slate-100"><Sparkles className="w-4 h-4 text-gold-500" /> Save 10%</li>
              </ul>

              <Button fullWidth onClick={() => handleBuySessions(120, BILLING_PRODUCT_IDS.PREMIUM_SESSIONS_120, 'premium')} disabled={loading} className="bg-gold-600 text-navy-950 font-bold hover:bg-gold-500">Buy 120 Sessions</Button>
           </div>

           {/* PREMIUM CONSULTANT */}
           <div className="bg-navy-900 border border-navy-800 hover:border-gold-500/30 transition-colors rounded-xl p-6 flex flex-col h-full relative group">
              <div className="mb-4">
                 <h3 className="font-bold text-lg text-slate-100">Consultant</h3>
                 <p className="text-xs text-slate-400 uppercase tracking-wider">Professionals</p>
              </div>
              <div className="text-3xl font-serif font-bold text-gold-400 mb-6">$119.99</div>
              
              <ul className="space-y-3 mb-8 flex-1">
                 <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 className="w-4 h-4 text-gold-500" /> 400 Sessions</li>
                 <li className="flex items-center gap-2 text-sm text-slate-300"><BrainCircuit className="w-4 h-4 text-gold-500" /> Expert Analysis</li>
                 <li className="flex items-center gap-2 text-sm text-slate-300"><Crown className="w-4 h-4 text-gold-500" /> Sessions across any cases</li>
                 <li className="flex items-center gap-2 text-sm text-slate-300"><Briefcase className="w-4 h-4 text-gold-500" /> Save 20%</li>
              </ul>

              <Button fullWidth onClick={() => handleBuySessions(400, BILLING_PRODUCT_IDS.PREMIUM_SESSIONS_400, 'premium')} disabled={loading} className="bg-navy-800 text-white hover:bg-navy-700">Buy 400 Sessions</Button>
           </div>
        </div>
        <button onClick={() => router.push('/')} className="w-full text-center text-xs text-slate-400 hover:text-slate-200 py-2 flex items-center justify-center gap-1"><ArrowLeft className="w-3 h-3" /> Back to Dashboard</button>
      </div>
    </div>
  );
};
