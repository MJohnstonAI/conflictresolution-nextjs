
"use client";

import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, RefreshCw, AlertTriangle, Shield, Scale, Mountain, Flame, ArrowLeft, Home, Copy, Info, Target, Fingerprint, Activity, ChevronLeft, ChevronRight, Download, Eye, EyeOff, Printer, FileText } from 'lucide-react';
import { store } from '../services/store';
import { analyzeConflict } from '../services/ai';
import { exportService } from '../services/export';
import { Case, Round, Mode, UserAccount } from '../types';
import { Button, Badge, RiskGauge } from '../components/UI';
import { toast } from '../components/DesignSystem';

// --- SUB-COMPONENTS ---

interface InputSectionProps {
    inputText: string;
    setInputText: (s: string) => void;
    senderName: string;
    setSenderName: (s: string) => void;
    isAnalyzing: boolean;
    isCaseClosed: boolean;
    analysisError: string | null;
    setAnalysisError: (s: string | null) => void;
    activeCase: Case;
    onSubmit: () => void;
    roundNumber: number;
    isHero?: boolean;
}

const InputSection: React.FC<InputSectionProps> = memo(({ 
    inputText, setInputText, senderName, setSenderName, isAnalyzing, isCaseClosed, analysisError, setAnalysisError, activeCase, onSubmit, roundNumber, isHero = false
}) => {
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (inputText) {
            setIsTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = window.setTimeout(() => setIsTyping(false), 800);
        }
        return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); };
    }, [inputText]);

    const containerClasses = isHero 
        ? "bg-navy-900/80 border border-gold-500/30 shadow-[0_0_40px_-10px_rgba(245,158,11,0.1)] p-6 md:p-8 rounded-2xl backdrop-blur-sm h-full flex flex-col justify-center"
        : "h-full flex flex-col justify-center max-w-4xl mx-auto w-full";

    const textareaClasses = isHero
        ? "w-full bg-navy-950/50 border border-navy-700 rounded-xl p-6 text-lg text-slate-200 placeholder-slate-600 outline-none transition-all resize-none flex-1 min-h-[200px] focus:border-gold-500/50 focus:bg-navy-950 focus:shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]"
        : `w-full bg-navy-900 border rounded-2xl p-6 text-base text-slate-300 placeholder-slate-500 outline-none transition-all resize-none flex-1 min-h-[300px] shadow-inner ${isTyping ? 'border-gold-500/50 shadow-[0_0_15px_-3px_rgba(245,158,11,0.15)]' : analysisError ? 'border-rose-500/50' : 'border-navy-800 focus:border-gold-500/30'}`;

    return (
        <div className={containerClasses}>
            {/* Identity Bar */}
            <div className={`flex items-center gap-3 ${isHero ? 'mb-6' : 'bg-navy-950 border border-navy-800 p-2 rounded-xl mb-4'}`}>
                <div className={`hidden md:flex flex-col items-start justify-center ${isHero ? '' : 'px-4 py-1.5 bg-navy-900 rounded-lg border border-navy-800 min-w-[100px]'}`}>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Adversary</span>
                    <div className="flex items-center gap-2">
                         <span className={`${isHero ? 'text-xl text-slate-100' : 'text-sm text-gold-500'} font-bold truncate max-w-[200px]`}>
                             {activeCase.opponentType}
                         </span>
                         {isHero && <Badge color="gray" >Target</Badge>}
                    </div>
                </div>
                
                <div className="flex-1 relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder={activeCase.opponentType === 'Other' ? "Enter Name" : `${activeCase.opponentType}'s Name (Optional)`}
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        disabled={isAnalyzing || isCaseClosed || !!activeCase.demoScenarioId}
                        autoComplete="off"
                        className={`w-full bg-transparent border-none rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-300 placeholder-slate-500 focus:ring-1 focus:ring-gold-500/50 outline-none ${isHero ? 'bg-navy-950 border border-navy-800' : 'bg-navy-900'}`}
                    />
                </div>
            </div>

            <div className="space-y-3 flex-1 flex flex-col">
                <label className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gold-500 uppercase tracking-widest pl-1 font-mono flex items-center gap-2">
                        {isHero ? <Activity className="w-3 h-3" /> : null}
                        {isHero ? "AWAITING TRANSMISSION (EVIDENCE)" : `ROUND ${roundNumber} // AWAITING INPUT`}
                    </span>
                    {inputText.length > 0 && <span className="text-[10px] font-mono text-slate-500">{inputText.length} chars</span>}
                </label>
                
                <textarea 
                    value={inputText}
                    onChange={(e) => {
                        setInputText(e.target.value);
                        if (analysisError) setAnalysisError(null);
                    }}
                    placeholder={`Paste the exact, unedited message from ${senderName || activeCase.opponentType} here.\n\nCRITICAL: Do not summarize or censor. The AI relies on specific phrasing to detect psychological nuances, gaslighting, and manipulation tactics.\n\nDisclaimer: Analysis accuracy depends entirely on input fidelity. Incomplete or paraphrased text may lead to suboptimal strategic advice.`}
                    className={textareaClasses}
                    disabled={isAnalyzing || isCaseClosed}
                />
            </div>

            <div className={isHero ? "mt-8" : "mt-6"}>
                <Button 
                    onClick={onSubmit}
                    fullWidth 
                    size="lg" 
                    disabled={isAnalyzing || isCaseClosed || !inputText.trim()}
                    className={`font-bold shadow-lg transition-all ${isHero ? 'bg-gold-600 hover:bg-gold-500 text-navy-950 py-5 text-lg shadow-gold-500/20' : 'bg-gold-600 hover:bg-gold-500 text-navy-950 shadow-gold-500/20'}`}
                >
                    {isAnalyzing ? (
                        <div className="flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span>Analyzing Psychology...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span>Analyze & Generate Response</span>
                            <ArrowLeft className="w-5 h-5 rotate-180" />
                        </div>
                    )}
                </Button>
            </div>

            {analysisError && (
                <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-900/20 p-4 rounded-xl border border-rose-500/20 mt-4 animate-fade-in">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{analysisError}</span>
                </div>
            )}
        </div>
    );
});

const ResponseToneSelector: React.FC<{ 
    mode: Mode; 
    active: boolean; 
    onClick: () => void;
}> = ({ mode, active, onClick }) => {
    const icons = {
        Peacekeeper: Shield,
        Barrister: Scale,
        Nuclear: Flame,
        "Grey Rock": Mountain
    };
    const Icon = icons[mode];

    const activeStyles = {
        Peacekeeper: "bg-emerald-500/10 text-emerald-400 border-emerald-500/50",
        Barrister: "bg-blue-500/10 text-blue-400 border-blue-500/50",
        Nuclear: "bg-rose-500/10 text-rose-400 border-rose-500/50",
        "Grey Rock": "bg-slate-500/10 text-slate-300 border-slate-500/50"
    };

    const baseStyle = "flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all flex-1";
    const style = active 
        ? `${baseStyle} ${activeStyles[mode]} shadow-sm` 
        : `${baseStyle} border-navy-800 bg-navy-900 text-slate-500 hover:border-navy-700 hover:text-slate-400`;

    return (
        <button onClick={onClick} className={style}>
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{mode}</span>
        </button>
    );
};

// --- SINGLE ROUND VIEW (Redesigned 2-Column) ---
const SingleRoundView: React.FC<{
    round: Round;
    onModeSelect: (id: string, mode: Mode) => void;
    opponentType: string;
    onNextRound: () => void;
    isLatest: boolean;
    userName?: string;
}> = ({ round, onModeSelect, opponentType, onNextRound, isLatest, userName }) => {

    const [showRawText, setShowRawText] = useState(false);

    // Helper to get current response text
    const currentResponse = round.responses[round.selectedMode === 'Peacekeeper' ? 'soft' : round.selectedMode === 'Barrister' ? 'firm' : round.selectedMode === 'Grey Rock' ? 'greyRock' : 'nuclear'] || "";

    return (
        <div className="h-full animate-fade-in pb-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
                
                {/* --- LEFT COLUMN: INTELLIGENCE & NARRATIVE --- */}
                <div className="flex flex-col gap-6 h-full min-h-0 overflow-hidden">
                    
                    {/* TOP: ADVERSARY'S NARRATIVE (Summary) */}
                    <div className="bg-navy-900 border border-navy-800 rounded-xl overflow-hidden shadow-lg flex-shrink-0 flex flex-col max-h-[50%]">
                        <div className="bg-navy-950 px-5 py-3 border-b border-navy-800 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-500" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Adversary's Narrative</span>
                            </div>
                            <button onClick={() => setShowRawText(!showRawText)} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 uppercase tracking-wider">
                                {showRawText ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
                                {showRawText ? "Hide Raw" : "View Raw"}
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar bg-navy-900/50 relative">
                            {showRawText ? (
                                <div className="animate-fade-in">
                                    <span className="text-[10px] font-bold text-slate-600 uppercase mb-2 block">Original Transcript</span>
                                    <p className="text-slate-400 text-sm whitespace-pre-wrap font-mono leading-relaxed bg-navy-950/50 p-4 rounded-lg border border-navy-800/50">{round.opponentText}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold text-gold-500 uppercase tracking-wide block mb-1">Key Conflict Points (AI Summary)</span>
                                    <p className="text-slate-200 text-base leading-relaxed whitespace-pre-wrap">
                                        "{round.analysisSummary}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BOTTOM: TACTICAL ANALYSIS */}
                    <div className="bg-navy-900 border border-navy-800 rounded-xl overflow-hidden shadow-lg flex-1 flex flex-col min-h-0">
                        <div className="bg-navy-950 px-5 py-3 border-b border-navy-800 flex items-center gap-2 shrink-0">
                            <Activity className="w-4 h-4 text-gold-500" />
                            <span className="text-xs font-bold text-gold-500 uppercase tracking-widest">Tactical Analysis</span>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                            {/* Vibe */}
                            <div className="bg-navy-950/30 p-4 rounded-lg border border-navy-800/50">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-2">Psychological Vibe</span>
                                <p className="text-sm text-slate-200 font-medium">"{round.vibeCheck}"</p>
                            </div>

                            {/* Tactics */}
                            <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-2">Detected Tactics</span>
                                <div className="flex flex-wrap gap-2">
                                    {round.detectedFallacies?.length ? round.detectedFallacies.map(f => (
                                        <span key={f} className="px-2.5 py-1 bg-rose-900/20 text-rose-300 border border-rose-500/20 rounded text-[10px] font-bold uppercase">{f}</span>
                                    )) : <span className="text-xs text-slate-600 italic">No overt manipulation detected.</span>}
                                </div>
                            </div>

                            <RiskGauge score={round.legalRiskScore || 0} />

                             {/* Expert Note */}
                            {round.expertInsights && (
                                <div className="bg-gold-500/5 border border-gold-500/10 p-4 rounded-lg flex gap-3">
                                    <Info className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-bold text-gold-500 uppercase mb-1">Expert Strategy</p>
                                        <p className="text-xs text-slate-300 italic leading-relaxed">{round.expertInsights}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* --- RIGHT COLUMN: STRATEGIC RESPONSE --- */}
                <div className="flex flex-col bg-navy-900 border border-navy-800 rounded-xl overflow-hidden shadow-lg h-full">
                    <div className="bg-navy-950 px-5 py-3 border-b border-navy-800 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Strategic Response</span>
                        </div>
                        <button 
                            onClick={() => { navigator.clipboard.writeText(currentResponse); toast("Response copied to clipboard", "success"); }}
                            className="text-[10px] font-bold text-slate-500 hover:text-white flex items-center gap-1 uppercase tracking-wider"
                        >
                            <Copy className="w-3 h-3"/> Copy Text
                        </button>
                    </div>

                    <div className="p-6 flex-1 flex flex-col min-h-0 gap-4">
                        
                        {/* Personalized Greeting */}
                        <div className="bg-navy-950/40 p-3 rounded-lg border border-navy-800/50 flex items-center gap-3 shrink-0">
                            <div className="w-8 h-8 rounded-full bg-navy-800 border border-gold-500/20 flex items-center justify-center text-gold-500">
                                <Activity className="w-4 h-4" />
                            </div>
                            <p className="text-xs text-slate-400">
                                Hi <span className="text-slate-100 font-bold">{userName || "User"}</span>, copy this response to your <span className="text-gold-500 font-bold">{opponentType}</span>
                            </p>
                        </div>

                        {/* Tone Selectors */}
                        <div className="flex gap-2 shrink-0">
                             {(['Peacekeeper', 'Barrister', 'Grey Rock', 'Nuclear'] as Mode[]).map(m => (
                                <ResponseToneSelector 
                                    key={m} 
                                    mode={m} 
                                    active={round.selectedMode === m} 
                                    onClick={() => onModeSelect(round.id, m)}
                                />
                             ))}
                        </div>

                        {/* Editor Area */}
                        <div className="flex-1 relative group">
                            <textarea 
                                readOnly 
                                className="w-full h-full bg-navy-950 text-slate-200 border border-navy-800 rounded-xl p-5 text-base leading-relaxed resize-none focus:outline-none focus:border-gold-500/30 custom-scrollbar"
                                value={currentResponse}
                            />
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <span className="text-[10px] bg-navy-900 text-slate-500 px-2 py-1 rounded border border-navy-700">Read-Only Preview</span>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="pt-2 shrink-0">
                            <Button 
                                fullWidth 
                                size="lg" 
                                onClick={onNextRound} 
                                className="flex justify-between items-center group bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-blue-500/20 shadow-lg"
                            >
                                <span>{isLatest ? "Next Round" : "View Next Round"}</span>
                                <div className="flex items-center gap-2">
                                    <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};


// --- MAIN WAR ROOM ---

export const WarRoom: React.FC = ({ caseId, initialText }: any) => {
    const params = useParams();
    const router = useRouter();
    const id = typeof params?.id === 'string' ? params.id : undefined;
    const [activeCase, setActiveCase] = useState<Case | null>(null);
    const [rounds, setRounds] = useState<Round[]>([]);
    const [loading, setLoading] = useState(true);
    const [allCases, setAllCases] = useState<Case[]>([]);
    const [account, setAccount] = useState<UserAccount | null>(null);
    
    // View State
    const [viewIndex, setViewIndex] = useState<number>(0); // 0 = Round 1, rounds.length = New Input
    
    // Input State
    const [inputText, setInputText] = useState(initialText || "");
    const [senderName, setSenderName] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    // Initial Load
    useEffect(() => {
        const targetId = caseId || id;
        if (!targetId) return;
        const load = async () => {
            const [c, r, cases, acc] = await Promise.all([
                store.getCase(targetId),
                store.getRounds(targetId),
                store.getCases(),
                store.getAccount()
            ]);
            
            if (!c) { router.push('/'); return; }
            
            setAllCases(cases);
            setActiveCase(c);
            setRounds(r);
            setAccount(acc);
            setLoading(false);
            
            // Set initial view to the latest round if exists
            if (r.length > 0) {
                setViewIndex(r.length - 1); 
                if (r[r.length-1].senderIdentity) setSenderName(r[r.length-1].senderIdentity || "");
            } else {
                setViewIndex(0); // Input mode (Round 1)
            }
        };
        load();
    }, [caseId, id, router]);

    // Create a mapping for sequential case numbers based on chronological order (Replicated from Vault)
    const caseNumberMap = useMemo(() => {
        const sortedAsc = [...allCases].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const map = new Map<string, number>();
        sortedAsc.forEach((c, idx) => map.set(c.id, idx + 1));
        return map;
    }, [allCases]);

    const caseNum = useMemo(() => activeCase ? (caseNumberMap.get(activeCase.id) || 0) : 0, [activeCase, caseNumberMap]);

    // Handle Analysis
    const handleAnalyze = async () => {
        if (!activeCase || !inputText.trim()) return;
        setIsAnalyzing(true);
        setAnalysisError(null);

        try {
            if (activeCase.roundsUsed >= activeCase.roundsLimit && !activeCase.isClosed) {
                const closedCase = { ...activeCase, isClosed: true };
                await store.saveCase(closedCase);
                setActiveCase(closedCase);
                throw new Error("Case limit reached. Case is now closed.");
            }
            if (activeCase.isClosed) throw new Error("This case is closed.");

            // Context
            const historyText = rounds.slice(-3).map(r => 
                `Round ${r.roundNumber}: Them: "${r.opponentText.substring(0, 200)}..."\nResponse (${r.selectedMode}): "${r.responses[r.selectedMode === 'Peacekeeper' ? 'soft' : r.selectedMode === 'Barrister' ? 'firm' : r.selectedMode === 'Grey Rock' ? 'greyRock' : 'nuclear']?.substring(0, 200)}..."`
            ).join('\n\n');

            const analysis = await analyzeConflict({
                opponentType: activeCase.opponentType,
                mode: 'Peacekeeper',
                goal: 'Hold boundaries',
                contextSummary: activeCase.note || "",
                historyText,
                currentText: inputText,
                planType: activeCase.planType,
                useDeepThinking: activeCase.planType === 'premium',
                demoScenarioId: activeCase.demoScenarioId,
                roundIndex: rounds.length,
                senderIdentity: senderName
            });

            const newRound: Round = {
                id: crypto.randomUUID(),
                caseId: activeCase.id,
                roundNumber: rounds.length + 1,
                createdAt: new Date().toISOString(),
                opponentText: inputText,
                senderIdentity: senderName,
                userGoal: 'Hold boundaries',
                isAnalyzed: true,
                selectedMode: 'Barrister',
                rerollsUsed: 0,
                ...analysis
            };

            await store.saveRound(newRound);
            const updatedCase = { ...activeCase, roundsUsed: activeCase.roundsUsed + 1 };
            await store.saveCase(updatedCase);
            
            const updatedRounds = [...rounds, newRound];
            setRounds(updatedRounds);
            setActiveCase(updatedCase);
            setInputText("");
            
            // Auto-switch view to the result we just generated
            setViewIndex(updatedRounds.length - 1); 
            toast("Analysis complete.", "success");

        } catch (e: any) {
            console.error(e);
            setAnalysisError(e.message || "Analysis failed.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleModeSelect = async (roundId: string, mode: Mode) => {
        const idx = rounds.findIndex(r => r.id === roundId);
        if (idx === -1) return;
        const updated = { ...rounds[idx], selectedMode: mode };
        const newRounds = [...rounds];
        newRounds[idx] = updated;
        setRounds(newRounds);
        await store.saveRound(updated);
    };

    const goToNext = () => {
        if (viewIndex < rounds.length) {
            setViewIndex(viewIndex + 1);
        }
    };

    const goToPrev = () => {
        if (viewIndex > 0) {
            setViewIndex(viewIndex - 1);
        }
    };

    const handleDownload = () => {
        if (!activeCase) return;
        toast("Preparing case file...", "info");
        exportService.printToPDF(activeCase, rounds);
    };

    if (loading || !activeCase) return <div className="flex items-center justify-center h-screen bg-navy-950"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div></div>;

    // Determine current view mode
    const isInputMode = viewIndex === rounds.length;
    const currentRound = !isInputMode ? rounds[viewIndex] : null;

    // Stats for Progress Bar
    const roundsUsedCount = rounds.length;
    const remainingCount = Math.max(0, activeCase.roundsLimit - roundsUsedCount);
    const progressPercentage = (roundsUsedCount / activeCase.roundsLimit) * 100;
    const displayRound = isInputMode ? rounds.length : (viewIndex + 1);

    return (
        <div className="w-full h-full">
            <div className="print-hidden flex flex-col h-full max-w-[1600px] mx-auto px-4 md:px-8 pb-6 w-full overflow-hidden">
                {/* 1. TOP HEADER */}
                <div className="py-4 flex items-center justify-between border-b border-navy-800 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/vault')} className="text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-serif font-bold text-slate-100 max-w-[200px] md:max-w-md truncate">{activeCase.title}</h1>
                                {activeCase.planType === 'premium' && <Badge color="amber">Premium</Badge>}
                            </div>
                        </div>
                    </div>
                    <button onClick={() => router.push('/')} className="p-2 rounded-full hover:bg-navy-900 text-slate-400 hover:text-gold-400"><Home className="w-5 h-5"/></button>
                </div>

                {/* 2. NAVIGATION BAR & PROGRESS TRACKER (Combined for visual density) */}
                <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 border-b border-navy-800/50 mb-4">
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={goToPrev} 
                            disabled={viewIndex === 0}
                            className="p-2 rounded-lg border border-navy-800 bg-navy-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                         >
                             <ChevronLeft className="w-5 h-5" />
                         </button>
                         
                         <div className="flex flex-col min-w-[240px] px-2">
                            <div className="flex justify-between items-end mb-1 gap-x-10">
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <div className="w-4 h-4 rounded bg-navy-950 border border-navy-800 flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-gold-500">{caseNum}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-100 uppercase tracking-widest font-mono">
                                        CASE {caseNum}
                                    </span>
                                </div>
                                <div className="text-right flex-1 min-w-0">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono whitespace-nowrap">
                                        ROUND {displayRound} / <span className="text-slate-300">REMAINING {remainingCount}</span>
                                    </span>
                                </div>
                            </div>
                            <div className="w-full bg-navy-950 h-1.5 rounded-full overflow-hidden border border-navy-800 shadow-inner">
                                <div 
                                    className={`h-full transition-all duration-700 ease-out ${activeCase.planType === 'premium' ? 'bg-gradient-to-r from-gold-600 to-gold-400' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`} 
                                    style={{width: `${progressPercentage}%`}} 
                                />
                            </div>
                         </div>

                         <button 
                            onClick={goToNext} 
                            disabled={viewIndex === rounds.length}
                            className="p-2 rounded-lg border border-navy-800 bg-navy-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                         >
                             <ChevronRight className="w-5 h-5" />
                         </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline text-[10px] font-mono text-gold-500 font-bold uppercase tracking-widest bg-navy-900 px-3 py-1.5 rounded border border-navy-800">
                             {isInputMode ? "AWAITING TRANSMISSION" : `VIEWING ROUND ${viewIndex + 1}`}
                        </span>
                        {!isInputMode && (
                            <button 
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white text-sm font-bold rounded-lg border border-navy-700 transition-all"
                            >
                                <Printer className="w-4 h-4" /> Print / PDF
                            </button>
                        )}
                    </div>
                </div>

                {/* 3. MAIN CONTENT AREA (Responsive Height) */}
                <div className="flex-1 min-h-0 relative">
                    {isInputMode ? (
                        <div className="h-full overflow-y-auto custom-scrollbar">
                            {rounds.length === 0 ? (
                                 <div className="h-full flex flex-col items-center max-w-5xl mx-auto pt-4 pb-10">
                                     {/* Mission Brief */}
                                     <div className="w-full bg-navy-900 border border-navy-800 rounded-xl p-5 mb-6 relative overflow-hidden shrink-0">
                                         <div className="absolute top-0 right-0 p-4 opacity-5"><Target className="w-24 h-24 text-gold-500" /></div>
                                         <div className="relative z-10 flex items-start gap-4">
                                             <div className="p-3 bg-navy-950 rounded-lg border border-navy-800"><Fingerprint className="w-6 h-6 text-gold-500" /></div>
                                             <div>
                                                 <span className="text-[10px] font-bold text-gold-500 uppercase tracking-widest font-mono">Mission Profile</span>
                                                 <h2 className="text-lg font-bold text-slate-100">Target: {activeCase.opponentType}</h2>
                                                 <p className="text-slate-400 text-sm italic mt-1 line-clamp-2">"{activeCase.note || 'No context provided.'}"</p>
                                             </div>
                                         </div>
                                     </div>
                                     
                                     {/* Input Form */}
                                     <div className="w-full flex-1 min-h-[400px]">
                                         <InputSection 
                                            inputText={inputText} setInputText={setInputText}
                                            senderName={senderName} setSenderName={setSenderName}
                                            isAnalyzing={isAnalyzing} isCaseClosed={activeCase.isClosed}
                                            analysisError={analysisError} setAnalysisError={setAnalysisError}
                                            activeCase={activeCase} onSubmit={handleAnalyze}
                                            roundNumber={rounds.length + 1} isHero={true}
                                         />
                                     </div>
                                 </div>
                            ) : (
                                 <InputSection 
                                    inputText={inputText} setInputText={setInputText}
                                    senderName={senderName} setSenderName={setSenderName}
                                    isAnalyzing={isAnalyzing} isCaseClosed={activeCase.isClosed}
                                    analysisError={analysisError} setAnalysisError={setAnalysisError}
                                    activeCase={activeCase} onSubmit={handleAnalyze}
                                    roundNumber={rounds.length + 1} isHero={false}
                                 />
                            )}
                         </div>
                    ) : (
                        currentRound && (
                            <SingleRoundView 
                                round={currentRound}
                                onModeSelect={handleModeSelect}
                                opponentType={activeCase.opponentType}
                                onNextRound={goToNext}
                                isLatest={viewIndex === rounds.length - 1}
                                userName={account?.name}
                            />
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
