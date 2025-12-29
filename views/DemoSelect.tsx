
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { store } from '../services/store';
import { Case } from '../types';
import { DEMO_SCENARIOS } from '../services/demo_scenarios';
import { ArrowLeft, Heart, Briefcase, PlayCircle, Lock, Zap, CheckCircle2, Crown } from 'lucide-react';
import { Button, Badge } from '../components/UI';

export const DemoSelect: React.FC = () => {
    const router = useRouter();

    const startDemo = (scenarioId: string) => {
        const scenario = DEMO_SCENARIOS[scenarioId];
        if (!scenario) return;

        const newCase: Case = {
            id: crypto.randomUUID(),
            title: `DEMO: ${scenario.title}`,
            opponentType: scenario.opponentType,
            createdAt: new Date().toISOString(),
            roundsLimit: scenario.rounds.length,
            roundsUsed: 0,
            planType: 'demo',
            isClosed: false,
            note: scenario.initialContext,
            demoScenarioId: scenarioId
        };

        store.saveCase(newCase);
        // Pass initialText as the first round's text to trigger the "Play" feel immediately
        router.push(`/case/${newCase.id}`);
    };

    return (
        <div className="min-h-screen bg-navy-950 p-6 flex flex-col items-center animate-fade-in">
            <div className="w-full max-w-4xl space-y-8">
                {/* Header */}
                <div className="flex flex-col items-start gap-4">
                    <button onClick={() => router.push('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </button>
                    <div>
                        <Badge color="gray">Interactive Simulator</Badge>
                        <h1 className="text-3xl font-serif font-bold text-slate-100 mt-2">Choose Your Experience</h1>
                        <p className="text-slate-300 max-w-xl mt-2">
                            Select a scenario to see how Conflict Resolution AI handles different types of disputes.
                            No sessions required.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* STANDARD DEMO */}
                    <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Heart className="w-24 h-24 text-blue-500" />
                        </div>
                        
                        <div className="relative z-10 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-blue-900/20 rounded-xl">
                                    <Heart className="w-6 h-6 text-blue-400" />
                                </div>
                                <Badge color="blue">Standard</Badge>
                            </div>
                            
                            <div>
                                <h3 className="text-xl font-bold text-slate-100">Relationship Dispute</h3>
                                <p className="text-sm text-slate-400 mt-1">"The Trust Trap"</p>
                            </div>

                            <p className="text-sm text-slate-300 leading-relaxed min-h-[60px]">
                                See how the AI navigates a tricky conversation with an insecure partner. Learn to de-escalate without sacrificing your boundaries.
                            </p>

                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 className="w-3 h-3 text-blue-500" /> Vibe Check Analysis</li>
                                <li className="flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 className="w-3 h-3 text-blue-500" /> Fallacy Detection</li>
                                <li className="flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 className="w-3 h-3 text-blue-500" /> 4 Response Strategies</li>
                            </ul>

                            <Button onClick={() => startDemo('demo_standard')} className="w-full bg-blue-600 hover:bg-blue-500 border-none text-white mt-4 gap-2">
                                <PlayCircle className="w-4 h-4" /> Start Standard Demo
                            </Button>
                        </div>
                    </div>

                    {/* PREMIUM DEMO */}
                    <div className="bg-gradient-to-br from-navy-900 to-navy-950 border border-gold-500/30 rounded-2xl p-6 hover:border-gold-500 transition-all group relative overflow-hidden shadow-lg shadow-black/20">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Briefcase className="w-24 h-24 text-gold-500" />
                        </div>

                        <div className="relative z-10 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-gold-500/10 rounded-xl">
                                    <Briefcase className="w-6 h-6 text-gold-500" />
                                </div>
                                <Badge color="amber">Premium</Badge>
                            </div>
                            
                            <div>
                                <h3 className="text-xl font-bold text-slate-100">Business Conflict</h3>
                                <p className="text-sm text-gold-500 mt-1">"The Equity Shake-Up"</p>
                            </div>

                            <p className="text-sm text-slate-300 leading-relaxed min-h-[60px]">
                                Experience the Professional model handling a high-stakes co-founder dispute. Includes <strong>Expert Insights</strong> explaining the negotiation strategy.
                            </p>

                             <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-xs text-slate-400"><Lock className="w-3 h-3 text-gold-500" /> Advanced Risk Assessment</li>
                                <li className="flex items-center gap-2 text-xs text-slate-400"><Zap className="w-3 h-3 text-gold-500" /> Expert Psychology Tooltips</li>
                                <li className="flex items-center gap-2 text-xs text-slate-400"><Crown className="w-3 h-3 text-gold-500" /> Negotiation Strategy</li>
                            </ul>

                            <Button onClick={() => startDemo('demo_premium')} className="w-full bg-gold-600 hover:bg-gold-500 border-none text-navy-950 font-bold mt-4 gap-2">
                                <PlayCircle className="w-4 h-4" /> Start Premium Demo
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
