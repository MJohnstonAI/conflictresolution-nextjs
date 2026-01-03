
"use client";

import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, RefreshCw, AlertTriangle, Shield, Scale, Mountain, Flame, ArrowLeft, Home, Copy, Info, Target, Fingerprint, Activity, ChevronLeft, ChevronRight, Download, Eye, EyeOff, Printer, FileText, PlayCircle, ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react';
import { store } from '../services/store';
import { analyzeConflict } from '../services/ai';
import { exportService } from '../services/export';
import { Case, Round, Mode, OpponentType, UserAccount } from '../types';
import { Button, Badge, RiskGauge } from '../components/UI';
import { toast, Combobox } from '../components/DesignSystem';
import { DEMO_SCENARIOS } from '../services/demo_scenarios';
import { setRouteState } from '../lib/route-state';
import { authService } from '../services/auth';

const MAX_EVIDENCE_CHARS = 20000;
const STANDARD_ANALYSIS_STAGES = [
    "Analyzing perspectives...",
    "Identifying common ground...",
    "Drafting resolution..."
];
const PREMIUM_ANALYSIS_STAGES = [
    "Analyzing perspectives...",
    "Mapping power dynamics...",
    "Assessing legal risk...",
    "Drafting resolution..."
];

const getSortedOpponentOptions = (): OpponentType[] => {
    const opts: OpponentType[] = [
        "Partner",
        "Co-Parent",
        "Ex Boy/Girlfriend",
        "Ex-Spouse",
        "Boss",
        "Landlord",
        "Friend",
        "Family",
        "In-Law",
        "Neighbor",
        "Colleague",
        "Bank",
        "Client",
        "Contractor",
        "Tenant",
        "Seller",
        "Buyer",
        "Roommate",
        "HOA Board",
        "Insurance Company",
        "Medical Aid Provider",
        "Employee",
        "Customer Support",
        "Wife",
        "Husband",
        "Boyfriend",
        "Girlfriend",
        "Company",
        "School",
        "Teacher",
        "Customer",
        "Car Dealership",
        "Other",
    ];
    return opts.sort();
};

type OpponentSignal = {
    type: OpponentType;
    keywords: string[];
    minHits: number;
};

const OPPONENT_SIGNALS: OpponentSignal[] = [
    { type: "Landlord", keywords: ["landlord", "property manager", "lease", "security deposit"], minHits: 1 },
    { type: "Tenant", keywords: ["tenant", "renter", "leaseholder"], minHits: 1 },
    { type: "Boss", keywords: ["boss", "manager", "supervisor", "employer", "hr"], minHits: 1 },
    { type: "Co-Parent", keywords: ["co-parent", "coparent", "custody", "visitation"], minHits: 1 },
    { type: "Ex-Spouse", keywords: ["ex-spouse", "ex spouse", "divorce", "alimony"], minHits: 1 },
    { type: "Ex Boy/Girlfriend", keywords: ["ex-boyfriend", "ex boyfriend", "ex-girlfriend", "ex girlfriend", "ex partner"], minHits: 1 },
    { type: "Roommate", keywords: ["roommate", "flatmate", "housemate"], minHits: 1 },
    { type: "Neighbor", keywords: ["neighbor", "neighbour", "next door"], minHits: 1 },
    { type: "Client", keywords: ["client"], minHits: 1 },
    { type: "Customer Support", keywords: ["customer support", "support ticket", "help desk"], minHits: 1 },
    { type: "Insurance Company", keywords: ["insurance"], minHits: 1 },
    { type: "Bank", keywords: ["bank", "loan"], minHits: 1 },
    { type: "Contractor", keywords: ["contractor", "freelancer"], minHits: 1 },
    { type: "Teacher", keywords: ["teacher", "professor"], minHits: 1 },
    { type: "School", keywords: ["school", "principal"], minHits: 1 },
    { type: "HOA Board", keywords: ["hoa", "homeowners association"], minHits: 1 },
    { type: "Medical Aid Provider", keywords: ["medical", "hospital", "clinic"], minHits: 1 },
    { type: "Friend", keywords: ["friend", "best friend"], minHits: 2 },
    { type: "Family", keywords: ["mother", "father", "parent", "sister", "brother", "aunt", "uncle", "cousin"], minHits: 2 },
    { type: "Colleague", keywords: ["colleague", "coworker", "co-worker", "teammate"], minHits: 2 },
];

const escapeOpponentRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const countOpponentHits = (content: string, keywords: string[]) => {
    let hits = 0;
    for (const keyword of keywords) {
        if (keyword.includes(" ")) {
            if (content.includes(keyword)) hits += 1;
            continue;
        }
        const regex = new RegExp(`\\b${escapeOpponentRegExp(keyword)}\\b`, "i");
        if (regex.test(content)) hits += 1;
    }
    return hits;
};

const inferOpponentFromNote = (note: string): OpponentType | null => {
    const trimmed = note.trim();
    if (!trimmed) return null;
    if (trimmed.length < 160) return null;
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    if (wordCount < 25) return null;

    const normalized = trimmed.toLowerCase();
    let best: OpponentType | null = null;
    let bestHits = 0;

    for (const signal of OPPONENT_SIGNALS) {
        const hits = countOpponentHits(normalized, signal.keywords);
        if (hits >= signal.minHits && hits > bestHits) {
            best = signal.type;
            bestHits = hits;
        }
    }

    return bestHits > 0 ? best : null;
};

const deriveCaseTitle = (currentTitle: string, opponent: string) => {
    if (!opponent || opponent === "Other") return currentTitle || "Conflict Case";
    if (!currentTitle || currentTitle === "Conflict Case" || currentTitle.endsWith(" Conflict Case")) {
        return `${opponent} Conflict Case`;
    }
    return currentTitle;
};

const getModePlainLanguage = (mode: Mode) => {
    switch (mode) {
        case "Peacekeeper":
            return "calm, de-escalating, and relationship-preserving";
        case "Barrister":
            return "clear, factual, and boundary-forward (paper-trail friendly)";
        case "Grey Rock":
            return "minimal, emotionless, and hard to argue with";
        case "Nuclear":
            return "high-impact and confrontational (bridge-burning)";
        default:
            return "strategic";
    }
};

const getRiskSummary = (score: number) => {
    if (score >= 75) return { label: "High", detail: "Avoid threats, admissions, or anything you'd regret in writing." };
    if (score >= 45) return { label: "Medium", detail: "Keep it factual; avoid escalating language or ultimatums." };
    if (score > 0) return { label: "Low", detail: "Still assume messages can be forwarded or screenshotted." };
    return { label: "Unknown", detail: "Risk score not available for this round." };
};

// --- SUB-COMPONENTS ---

interface InputSectionProps {
    inputText: string;
    setInputText: (s: string) => void;
    senderName: string;
    isAnalyzing: boolean;
    isCaseClosed: boolean;
    analysisError: string | null;
    setAnalysisError: (s: string | null) => void;
    activeCase: Case;
    onSubmit: () => void;
    roundNumber: number;
    maxChars: number;
    canCondense: boolean;
    isCondensing: boolean;
    onCondense: () => void;
    isDemo?: boolean;
    demoHasNext?: boolean;
    analysisStages?: string[];
    analysisStageIndex?: number;
}

const InputSection: React.FC<InputSectionProps> = memo(({ 
    inputText, setInputText, senderName, isAnalyzing, isCaseClosed, analysisError, setAnalysisError, activeCase, onSubmit, roundNumber, maxChars, canCondense, isCondensing, onCondense, isDemo = false, demoHasNext = true, analysisStages, analysisStageIndex
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

    const containerClasses = "bg-navy-950/70 border border-navy-800 shadow-[0_0_40px_-10px_rgba(15,23,42,0.4)] p-6 md:p-8 rounded-2xl w-full flex flex-col min-h-[520px]";

    const textareaClasses = `w-full border rounded-2xl p-6 text-base text-slate-900 outline-none transition-all resize-none flex-1 min-h-[360px] shadow-inner focus:ring-2 focus:ring-gold-500/20 ${
        isDemo
            ? "bg-navy-950 text-slate-100 placeholder-slate-500"
            : "bg-white placeholder-slate-400"
    } ${isTyping ? 'border-gold-500/50 shadow-[0_0_15px_-3px_rgba(245,158,11,0.15)]' : analysisError ? 'border-rose-500/50' : 'border-navy-200/10 focus:border-gold-500/30'}`;

    const placeholderText = isDemo
        ? "Demo playback is read-only. Press play to reveal the next scripted message."
        : `Paste the exact, unedited message from ${senderName || activeCase.opponentType} here.\n\nCRITICAL: Do not summarize or censor. The AI relies on specific phrasing to detect psychological nuances, gaslighting, and manipulation tactics.\n\nDisclaimer: Analysis accuracy depends entirely on input fidelity. Incomplete or paraphrased text may lead to suboptimal strategic advice.`;

    const actionLabel = isDemo
        ? demoHasNext
            ? roundNumber === 1
                ? "Play Demo Round 1"
                : "Play Next Demo Round"
            : "Demo Complete"
        : "Analyze & Generate Response";

    const actionDisabled = isAnalyzing || isCaseClosed || (isDemo ? !demoHasNext : !inputText.trim());
    const stageCount = analysisStages?.length ?? 0;
    const stageIndex = stageCount > 0 ? Math.min(analysisStageIndex ?? 0, stageCount - 1) : 0;
    const stageLabel = stageCount > 0 ? analysisStages?.[stageIndex] : null;

    return (
        <div className={containerClasses}>
            <div className="space-y-3 flex-1 flex flex-col">
                <label className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[10px] font-bold text-gold-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                            <Activity className="w-3 h-3" />
                            {isDemo ? `DEMO ROUND ${roundNumber} // READY TO PLAY` : "05 Awaiting Transmission (Evidence)"}
                        </span>
                        {!isDemo && (
                            <div className="flex items-center gap-2">
                                <span className="text-base font-semibold text-slate-100">{activeCase.opponentType}</span>
                                <Badge color="gray">Target</Badge>
                            </div>
                        )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                        {inputText.length.toLocaleString()} / {maxChars.toLocaleString()}
                    </span>
                </label>

                <textarea 
                    value={inputText}
                    onChange={(e) => {
                        if (isDemo) return;
                        setInputText(e.target.value);
                        if (analysisError) setAnalysisError(null);
                    }}
                    placeholder={placeholderText}
                    className={textareaClasses}
                    readOnly={isDemo}
                    disabled={isAnalyzing || isCaseClosed}
                />
                {!isDemo && inputText.length > maxChars && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                        <span>
                            Only the first {maxChars.toLocaleString()} characters are analyzed. {canCondense ? "Condense to fit or split into multiple rounds." : "Split into multiple rounds to include everything."}
                        </span>
                        {canCondense && (
                            <button
                                type="button"
                                onClick={onCondense}
                                disabled={isCondensing}
                                className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-100 hover:bg-amber-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isCondensing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                {isCondensing ? "Condensing" : "Condense to fit"}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {!isDemo && isAnalyzing && stageLabel && (
                <div className="mt-4 rounded-xl border border-navy-800 bg-navy-950/60 px-4 py-3 text-xs text-slate-300 animate-fade-in">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-500/40 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Streaming analysis</span>
                        <span className="text-[10px] text-slate-500">Stage {stageIndex + 1} / {stageCount}</span>
                    </div>
                    <div className="text-sm text-slate-200 mt-1">{stageLabel}</div>
                </div>
            )}

            <div className="mt-8">
                <Button 
                    onClick={onSubmit}
                    fullWidth 
                    size="lg" 
                    disabled={actionDisabled}
                    className="font-bold shadow-lg transition-all bg-gold-600 hover:bg-gold-500 text-navy-950 py-5 text-lg shadow-gold-500/20"
                >
                    {isAnalyzing ? (
                        <div className="flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span>{isDemo ? "Loading Demo Round..." : "Analyzing Psychology..."}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            {isDemo ? <PlayCircle className="w-5 h-5" /> : null}
                            <span>{actionLabel}</span>
                            {!isDemo && <ArrowLeft className="w-5 h-5 rotate-180" />}
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
    onPrint?: () => void;
    isLatest: boolean;
    userName?: string;
    isDemo?: boolean;
    demoHasNext?: boolean;
}> = ({ round, onModeSelect, opponentType, onNextRound, onPrint, isLatest, userName, isDemo = false, demoHasNext = true }) => {

    const [showRawText, setShowRawText] = useState(isDemo);
    const [showWhy, setShowWhy] = useState(false);
    const [showWatchFor, setShowWatchFor] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);
    const [showMobileAnalysis, setShowMobileAnalysis] = useState(false);
    const copyTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
        };
    }, []);

    // Helper to get current response text
    const currentResponse = round.responses[round.selectedMode === 'Peacekeeper' ? 'soft' : round.selectedMode === 'Barrister' ? 'firm' : round.selectedMode === 'Grey Rock' ? 'greyRock' : 'nuclear'] || "";
    const riskSummary = getRiskSummary(round.legalRiskScore || 0);

    return (
        <div className="h-full animate-fade-in pb-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
                
                {/* --- LEFT COLUMN: INTELLIGENCE & NARRATIVE --- */}
                <div className={`flex-col gap-6 h-full min-h-0 overflow-hidden order-2 lg:order-1 ${showMobileAnalysis ? 'flex' : 'hidden lg:flex'}`}>
                    
                    {/* TOP: ADVERSARY'S NARRATIVE (Summary) */}
                    <div className="bg-navy-900 border border-navy-800 rounded-xl overflow-hidden shadow-lg flex-shrink-0 flex flex-col max-h-[50%]">
                        <div className="bg-navy-950 px-5 py-3 border-b border-navy-800 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-500" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Adversary's Narrative</span>
                            </div>
                            {!isDemo && (
                                <button onClick={() => setShowRawText(!showRawText)} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 uppercase tracking-wider">
                                    {showRawText ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
                                    {showRawText ? "Hide Raw" : "View Raw"}
                                </button>
                            )}
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
                <div className="flex flex-col bg-navy-900 border border-navy-800 rounded-xl overflow-hidden shadow-lg h-full order-1 lg:order-2">
                    <div className="bg-navy-950 px-5 py-3 border-b border-navy-800 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Strategic Response</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(currentResponse);
                                    toast("Draft Copied to Clipboard", "success");
                                    setHasCopied(true);
                                    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
                                    copyTimeoutRef.current = window.setTimeout(() => setHasCopied(false), 2000);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg border border-blue-500 transition-all"
                            >
                                {hasCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4"/>}
                                {hasCopied ? "Copied" : "Copy Text"}
                            </button>
                            {onPrint && (
                                <button
                                    onClick={onPrint}
                                    className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white text-sm font-bold rounded-lg border border-navy-700 transition-all"
                                >
                                    <Printer className="w-4 h-4" /> Print / PDF
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col min-h-0 gap-4">
                        <button
                            type="button"
                            onClick={() => setShowMobileAnalysis((prev) => !prev)}
                            className="lg:hidden inline-flex items-center justify-center gap-2 rounded-lg border border-navy-800 bg-navy-950/40 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:bg-navy-900/60 transition-colors"
                        >
                            {showMobileAnalysis ? "Hide Analysis" : "Show Analysis"}
                        </button>
                        
                        {/* Personalized Greeting */}
                        <div className="bg-navy-950/40 p-3 rounded-lg border border-navy-800/50 flex items-center gap-3 shrink-0">
                            <div className="w-8 h-8 rounded-full bg-navy-800 border border-gold-500/20 flex items-center justify-center text-gold-500">
                                <Activity className="w-4 h-4" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-400">
                                    Hi <span className="text-slate-100 font-bold">{userName || "User"}</span>, copy this response to your <span className="text-gold-500 font-bold">{opponentType}</span>
                                </p>
                                <p className="text-[11px] text-slate-500">Drafts are read-only for safety. Copy to personalize.</p>
                            </div>
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

                        {/* Confidence & Risk Explanation (Inline Toggles) */}
                        <div className="space-y-2 shrink-0">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowWhy((v) => !v)}
                                    className="flex items-center justify-between gap-2 rounded-xl border border-navy-800 bg-navy-950/40 px-4 py-3 text-left text-base font-semibold text-slate-200 hover:bg-navy-950/60 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <Info className="w-4 h-4 text-blue-400" />
                                        Why this response?
                                    </span>
                                    {showWhy ? (
                                        <ChevronUp className="w-4 h-4 text-slate-500" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-slate-500" />
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowWatchFor((v) => !v)}
                                    className="flex items-center justify-between gap-2 rounded-xl border border-navy-800 bg-navy-950/40 px-4 py-3 text-left text-base font-semibold text-slate-200 hover:bg-navy-950/60 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                                        What to watch for?
                                    </span>
                                    {showWatchFor ? (
                                        <ChevronUp className="w-4 h-4 text-slate-500" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-slate-500" />
                                    )}
                                </button>
                            </div>

                            {showWhy && (
                                <div className="rounded-xl border border-navy-800 bg-navy-950/30 px-4 py-3 text-base text-slate-300 leading-relaxed animate-fade-in space-y-2">
                                    <div className="text-base font-semibold uppercase tracking-widest text-slate-500">
                                        In plain English
                                    </div>
                                    <div>
                                        This draft uses a <span className="text-slate-100 font-semibold">{round.selectedMode}</span> tone —{" "}
                                        {getModePlainLanguage(round.selectedMode)} — to keep you aligned with your goal:{" "}
                                        <span className="text-slate-100 font-semibold">{round.userGoal || "Hold boundaries"}</span>.
                                    </div>
                                    {round.analysisSummary && (
                                        <div>
                                            It addresses the core issue the AI detected:{" "}
                                            <span className="text-slate-100 font-semibold">"{round.analysisSummary}"</span>
                                        </div>
                                    )}
                                    {round.expertInsights && (
                                        <div className="text-slate-400">
                                            Strategy note: <span className="italic">{round.expertInsights}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {showWatchFor && (
                                <div className="rounded-xl border border-navy-800 bg-navy-950/30 px-4 py-3 text-base text-slate-300 leading-relaxed animate-fade-in space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-base font-semibold uppercase tracking-widest text-slate-500">
                                            Risk quick check
                                        </div>
                                        <div className="text-base font-semibold uppercase tracking-widest text-slate-500">
                                            Risk: <span className="text-slate-200">{riskSummary.label}</span>
                                        </div>
                                    </div>
                                    <div>{riskSummary.detail}</div>
                                    {round.detectedFallacies?.length ? (
                                        <div className="text-slate-400">
                                            If they keep using:{" "}
                                            <span className="text-slate-200 font-semibold">{round.detectedFallacies.join(", ")}</span>
                                            , consider switching tones (e.g., <span className="text-slate-200 font-semibold">Barrister</span>) to stay factual.
                                        </div>
                                    ) : null}
                                    <div className="text-slate-500">
                                        Tip: If anything here touches legal or safety issues, consult a qualified professional before sending.
                                    </div>
                                </div>
                            )}
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
                            disabled={isLatest && isDemo && !demoHasNext}
                            className="flex justify-between items-center group bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-blue-500/20 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>
                                {isDemo && isLatest
                                    ? demoHasNext
                                        ? "Play Next Demo Round"
                                        : "Demo Complete"
                                    : isLatest
                                        ? "Next Round"
                                        : "View Next Round"}
                            </span>
                            <div className="flex items-center gap-2">
                                {!isDemo && <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />}
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
    const [analysisStageIndex, setAnalysisStageIndex] = useState(0);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [selectedOpponent, setSelectedOpponent] = useState<string>("");
    const [inputMode, setInputMode] = useState(true);
    const [isCondensing, setIsCondensing] = useState(false);
    const [showNavHint, setShowNavHint] = useState(false);
    const analyzeInFlight = useRef(false);
    const opponentOptions = useMemo(() => getSortedOpponentOptions(), []);
    const demoScenario = useMemo(
        () => (activeCase?.demoScenarioId ? DEMO_SCENARIOS[activeCase.demoScenarioId] : undefined),
        [activeCase?.demoScenarioId]
    );
    const isDemo = !!activeCase?.demoScenarioId && activeCase?.planType === "demo";
    const canCondense = !isDemo && account?.role !== "demo";
    const latestRoundIndex = rounds.length - 1;
    const analysisStages = useMemo(() => {
        if (isDemo) return [];
        if (activeCase?.planType === "premium") return PREMIUM_ANALYSIS_STAGES;
        return STANDARD_ANALYSIS_STAGES;
    }, [activeCase?.planType, isDemo]);

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

            let caseData = c;
            if (caseData.demoScenarioId) {
                const scenario = DEMO_SCENARIOS[caseData.demoScenarioId];
                if (scenario && caseData.roundsLimit !== scenario.rounds.length) {
                    caseData = { ...caseData, roundsLimit: scenario.rounds.length };
                    await store.saveCase(caseData);
                }
            }
            if (caseData.opponentType === "Other" && r.length === 0) {
                const suggestedOpponent = inferOpponentFromNote(caseData.note || "");
                if (suggestedOpponent) {
                    caseData = {
                        ...caseData,
                        opponentType: suggestedOpponent,
                        title: deriveCaseTitle(caseData.title, suggestedOpponent),
                    };
                    await store.saveCase(caseData);
                }
            }

            setAllCases(cases);
            setActiveCase(caseData);
            setRounds(r);
            setAccount(acc);
            setLoading(false);
            setSelectedOpponent(caseData.opponentType || "");
            
            // Set initial view to the first round if exists
            if (r.length > 0) {
                setViewIndex(0);
                setInputMode(false);
                if (r[0].senderIdentity) setSenderName(r[0].senderIdentity || "");
            } else {
                setViewIndex(0); // Input mode (Round 1)
                setInputMode(true);
            }
        };
        load();
    }, [caseId, id, opponentOptions, router]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const seen = window.localStorage.getItem("cr_nav_hint_seen");
        if (!seen) setShowNavHint(true);
    }, []);

    useEffect(() => {
        if (!isAnalyzing || analysisStages.length === 0) {
            setAnalysisStageIndex(0);
            return;
        }
        setAnalysisStageIndex(0);
        const interval = window.setInterval(() => {
            setAnalysisStageIndex((prev) => (prev + 1 < analysisStages.length ? prev + 1 : prev));
        }, 1800);
        return () => window.clearInterval(interval);
    }, [analysisStages, isAnalyzing]);

    useEffect(() => {
        if (isDemo) return;
        if (!inputMode) return;
        if (viewIndex < rounds.length) {
            const round = rounds[viewIndex];
            setInputText(round?.opponentText || "");
            setSenderName(round?.senderIdentity || "");
            return;
        }
        setInputText("");
        setSenderName("");
    }, [inputMode, viewIndex, rounds, isDemo]);

    useEffect(() => {
        if (!isDemo || !demoScenario) return;
        const nextRound = demoScenario.rounds[rounds.length];
        setInputText(nextRound ? nextRound.opponentText : "");
    }, [isDemo, demoScenario, rounds.length]);

    const handleCondenseEvidence = async () => {
        if (isCondensing || !inputText.trim()) return;
        setIsCondensing(true);
        try {
            const session = await authService.getSession();
            const token = session?.access_token;
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (token) headers.Authorization = `Bearer ${token}`;
            const response = await fetch("/api/message-summarize", {
                method: "POST",
                headers,
                body: JSON.stringify({ text: inputText, limit: MAX_EVIDENCE_CHARS }),
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok || !payload?.data?.text) {
                const message =
                    payload?.error?.message ||
                    (typeof payload?.message === "string" ? payload.message : null) ||
                    "Failed to condense evidence.";
                throw new Error(message);
            }
            setInputText(payload.data.text);
            toast("Evidence condensed to fit the limit.", "success");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to condense evidence.";
            toast(message, "error");
        } finally {
            setIsCondensing(false);
        }
    };

    const updateCaseOpponent = async (nextOpponent: string) => {
        if (!activeCase) return;
        const updatedCase = {
            ...activeCase,
            opponentType: nextOpponent,
            title: deriveCaseTitle(activeCase.title, nextOpponent),
        };
        setActiveCase(updatedCase);
        await store.saveCase(updatedCase);
    };

    const handleOpponentChange = async (nextOpponent: string) => {
        setSelectedOpponent(nextOpponent);
        await updateCaseOpponent(nextOpponent);
    };

    // Create a mapping for sequential case numbers based on chronological order (Replicated from Vault)
    const caseNumberMap = useMemo(() => {
        const sortedAsc = [...allCases].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const map = new Map<string, number>();
        sortedAsc.forEach((c, idx) => map.set(c.id, idx + 1));
        return map;
    }, [allCases]);

    const caseNum = useMemo(() => activeCase ? (caseNumberMap.get(activeCase.id) || 0) : 0, [activeCase, caseNumberMap]);

    const appendDemoRound = async () => {
        if (!activeCase || !demoScenario) {
            setAnalysisError("Demo scenario missing. Please restart the demo.");
            return;
        }

        const nextIndex = rounds.length;
        const scriptRound = demoScenario.rounds[nextIndex];
        if (!scriptRound) {
            if (!activeCase.isClosed) {
                const closedCase = { ...activeCase, isClosed: true, roundsLimit: demoScenario.rounds.length };
                await store.saveCase(closedCase);
                setActiveCase(closedCase);
            }
            setAnalysisError("Demo complete. You've reached the end of the scripted case.");
            toast("Demo complete.", "info");
            return;
        }

        const roundsLimit = demoScenario.rounds.length;
        const roundsUsedCount = Math.max(activeCase.roundsUsed, rounds.length);
        if (roundsUsedCount >= roundsLimit && !activeCase.isClosed) {
            const closedCase = { ...activeCase, isClosed: true, roundsLimit };
            await store.saveCase(closedCase);
            setActiveCase(closedCase);
            setAnalysisError("Demo complete. You've reached the end of the scripted case.");
            return;
        }

        const { opponentText, ...analysis } = scriptRound;
        const newRound: Round = {
            id: crypto.randomUUID(),
            caseId: activeCase.id,
            roundNumber: rounds.length + 1,
            createdAt: new Date().toISOString(),
            opponentText,
            senderIdentity: senderName,
            userGoal: 'Hold boundaries',
            isAnalyzed: true,
            selectedMode: 'Peacekeeper',
            rerollsUsed: 0,
            modelSlug: "demo-script",
            ...analysis
        };

        await store.saveRound(newRound);
        const updatedCase = { ...activeCase, roundsUsed: roundsUsedCount + 1, roundsLimit };
        await store.saveCase(updatedCase);

        const updatedRounds = [...rounds, newRound];
        setRounds(updatedRounds);
        setActiveCase(updatedCase);
        setAnalysisError(null);
        setViewIndex(updatedRounds.length - 1);
    };

    // Handle Analysis
    const handleAnalyze = async () => {
        if (!activeCase) return;
        if (isDemo) {
            if (isAnalyzing || analyzeInFlight.current) return;
            analyzeInFlight.current = true;
            setIsAnalyzing(true);
            try {
                await appendDemoRound();
            } finally {
                setIsAnalyzing(false);
                analyzeInFlight.current = false;
            }
            return;
        }
        if (!inputText.trim()) return;
        if (analyzeInFlight.current) return;
        analyzeInFlight.current = true;
        setIsAnalyzing(true);
        setAnalysisError(null);

        try {
            const roundsUsedCount = Math.max(activeCase.roundsUsed, rounds.length);
            if (activeCase.isClosed) throw new Error("This case is closed.");

            // Context
            const historyText = rounds.slice(-3).map(r => 
                `Round ${r.roundNumber}: Them: "${r.opponentText.substring(0, 200)}..."\nResponse (${r.selectedMode}): "${r.responses[r.selectedMode === 'Peacekeeper' ? 'soft' : r.selectedMode === 'Barrister' ? 'firm' : r.selectedMode === 'Grey Rock' ? 'greyRock' : 'nuclear']?.substring(0, 200)}..."`
            ).join('\n\n');

            const analysis = await analyzeConflict({
                caseId: activeCase.id,
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
                selectedMode: 'Peacekeeper',
                rerollsUsed: 0,
                ...analysis
            };

            await store.saveRound(newRound);
            const updatedCase = { ...activeCase, roundsUsed: roundsUsedCount + 1 };
            await store.saveCase(updatedCase);
            const refreshedAccount = await store.getAccount();
            
            const updatedRounds = [...rounds, newRound];
            setRounds(updatedRounds);
            setActiveCase(updatedCase);
            setAccount(refreshedAccount);
            setInputText("");
            
            // Auto-switch view to the result we just generated
            setViewIndex(updatedRounds.length - 1);
            setInputMode(false);
            toast("Analysis complete.", "success");

        } catch (e: unknown) {
            console.error(e);
            const message =
                e instanceof Error ? e.message : typeof e === "string" ? e : "Analysis failed.";
            setAnalysisError(message);
        } finally {
            setIsAnalyzing(false);
            analyzeInFlight.current = false;
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
        if (isDemo && viewIndex === rounds.length - 1) {
            const hasNextDemoRound = demoScenario && rounds.length < demoScenario.rounds.length;
            if (hasNextDemoRound) {
                handleAnalyze();
                return;
            }
            return;
        }
        if (inputMode) {
            if (viewIndex < rounds.length) {
                setInputMode(false);
            }
            return;
        }
        setInputMode(true);
        setViewIndex(viewIndex + 1);
    };

    const goToPrev = () => {
        if (inputMode) {
            if (viewIndex === 0) {
                if (activeCase) {
                    setRouteState("/", {
                        templateText: activeCase.note || "",
                        opponentType: activeCase.opponentType || "Other",
                        planType: activeCase.planType,
                    });
                }
                router.push('/');
                return;
            }
            setInputMode(false);
            setViewIndex(viewIndex - 1);
            return;
        }
        setInputMode(true);
    };

    const handleHeaderBack = () => {
        goToPrev();
    };

    const handleJumpToLatest = () => {
        if (latestRoundIndex < 0) return;
        setInputMode(false);
        setViewIndex(latestRoundIndex);
    };

    const handleDownload = () => {
        if (!activeCase) return;
        toast("Preparing case file...", "info");
        exportService.printToPDF(activeCase, rounds);
    };

    if (loading || !activeCase) return <div className="flex items-center justify-center h-screen bg-navy-950"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div></div>;

    // Determine current view mode
        const isInputMode = inputMode;
    const currentRound = !isInputMode ? rounds[viewIndex] : null;
    const viewLabel = isInputMode ? "Evidence" : "Results";

    const roundsUsedCount = Math.max(rounds.length, activeCase.roundsUsed);
    const displayRound = isInputMode ? viewIndex : (viewIndex + 1);
    const standardSessions = account?.standardSessions ?? 0;
    const premiumSessions = account?.premiumSessions ?? 0;
    const activeSessions = activeCase.planType === "premium" ? premiumSessions : standardSessions;
    const activeModelSlug =
        currentRound?.modelSlug ||
        [...rounds].reverse().find((round) => round.modelSlug)?.modelSlug ||
        (activeCase.planType === "premium"
            ? "anthropic/claude-sonnet-4.5"
            : activeCase.planType === "standard"
              ? "anthropic/claude-haiku-4.5"
              : "demo-script");
    const demoHasNext = isDemo && !!demoScenario?.rounds[rounds.length];

    return (
        <div className="w-full h-full">
            <div className="print-hidden flex flex-col h-full max-w-[1600px] mx-auto px-4 md:px-8 pb-6 w-full overflow-hidden">
                {/* 1. TOP HEADER */}
                <div className="py-4 flex flex-col gap-4 border-b border-navy-800 shrink-0">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4 min-w-0">
                            <button onClick={handleHeaderBack} className="text-slate-400 hover:text-white transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-xl font-serif font-bold text-slate-100 max-w-[200px] md:max-w-md truncate">{activeCase.title}</h1>
                                    {activeCase.planType === 'premium' && <Badge color="amber">Premium</Badge>}
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={goToPrev} 
                                            className="p-2 rounded-lg border border-navy-800 bg-navy-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-widest font-mono">
                                                <span className="text-slate-100">Case {caseNum}</span>
                                                <span className="text-slate-500">{viewLabel} • Round {displayRound}</span>
                                            </div>
                                            {rounds.length > 0 && (!(!isInputMode && viewIndex === latestRoundIndex)) && (
                                                <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                                                    <button
                                                        type="button"
                                                        onClick={handleJumpToLatest}
                                                        className="text-blue-400 hover:text-blue-300 transition-colors"
                                                    >
                                                        Jump to Latest
                                                    </button>
                                                </div>
                                            )}
                                            {showNavHint && (
                                                <div className="flex items-center gap-2 text-[9px] text-slate-500">
                                                    <span>Use ← / → to flip</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowNavHint(false);
                                                            window.localStorage.setItem("cr_nav_hint_seen", "true");
                                                        }}
                                                        className="text-slate-300 hover:text-slate-100"
                                                    >
                                                        Got it
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            onClick={goToNext} 
                                            disabled={isInputMode && viewIndex === rounds.length}
                                            className="p-2 rounded-lg border border-navy-800 bg-navy-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-1 truncate">
                                    Model: <span className="text-slate-400">{activeModelSlug}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 justify-between md:justify-end">
                            <div className="text-right">
                                <div
                                  className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
                                  title="1 Session generates strategy + mediation-style guidance + draft responses for one round."
                                >
                                  Sessions Remaining
                                </div>
                                <div className="text-sm font-bold text-slate-100">{activeSessions}</div>
                            </div>
                            <button onClick={() => router.push('/')} className="p-2 rounded-full hover:bg-navy-900 text-slate-400 hover:text-gold-400"><Home className="w-5 h-5"/></button>
                        </div>
                    </div>
                </div>

                {/* 2. MAIN CONTENT AREA (Responsive Height) */}
                <div className="flex-1 min-h-0 relative pt-4">
                    {isInputMode ? (
                        <div className="h-full overflow-y-auto custom-scrollbar">
                            <div className="h-full flex flex-col items-center max-w-6xl mx-auto pt-4 pb-10 gap-6">
                                <div className="w-full bg-navy-900 border border-navy-800 rounded-2xl p-5 relative overflow-hidden shrink-0">
                                    <div className="absolute top-0 right-0 p-4 opacity-5"><Target className="w-24 h-24 text-gold-500" /></div>
                                    <div className="relative z-10 flex items-start gap-4">
                                        <div className="p-3 bg-navy-950 rounded-lg border border-navy-800"><Fingerprint className="w-6 h-6 text-gold-500" /></div>
                                        <div>
                                            <span className="text-[10px] font-bold text-gold-500 uppercase tracking-widest">03 Mission Profile</span>
                                            <p className="text-slate-400 text-sm italic mt-1 line-clamp-2">"{activeCase.note || 'No context provided.'}"</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full bg-navy-900 border border-navy-800 rounded-2xl shrink-0">
                                    <div className="px-5 pt-5 grid gap-4 text-[10px] font-bold text-gold-500 uppercase tracking-widest md:grid-cols-[320px_minmax(0,1fr)] md:items-center">
                                        <span>04 Choose Adversary</span>
                                        <label htmlFor="adversary-name" className="pl-1">
                                            Specify Adversary Name
                                        </label>
                                    </div>
                                        <div className="p-5 pt-3 grid gap-4 md:grid-cols-[320px_minmax(0,1fr)] md:items-center">
                                            <div className="space-y-2">
                                                <Combobox
                                                    options={opponentOptions}
                                                    value={selectedOpponent}
                                                    onChange={handleOpponentChange}
                                                    placeholder="Select an adversary"
                                                />
                                            </div>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input
                                                id="adversary-name"
                                                type="text"
                                                aria-label="Adversary name (optional)"
                                                placeholder={
                                                    selectedOpponent && selectedOpponent !== "Other"
                                                        ? `${selectedOpponent}'s Name (Optional)`
                                                        : "Adversary's Name (Optional)"
                                                }
                                                value={senderName}
                                                onChange={(event) => setSenderName(event.target.value)}
                                                disabled={isAnalyzing || activeCase.isClosed || !!activeCase.demoScenarioId}
                                                autoComplete="off"
                                                className="w-full bg-navy-950 border border-navy-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="w-full flex-1 min-h-[520px]">
                                    <InputSection 
                                        inputText={inputText} setInputText={setInputText}
                                        senderName={senderName}
                                        isAnalyzing={isAnalyzing} isCaseClosed={activeCase.isClosed}
                                        analysisError={analysisError} setAnalysisError={setAnalysisError}
                                        activeCase={activeCase} onSubmit={handleAnalyze}
                                        roundNumber={rounds.length + 1}
                                        maxChars={MAX_EVIDENCE_CHARS}
                                        canCondense={Boolean(canCondense)}
                                        isCondensing={isCondensing}
                                        onCondense={handleCondenseEvidence}
                                        isDemo={isDemo}
                                        demoHasNext={demoHasNext}
                                        analysisStages={analysisStages}
                                        analysisStageIndex={analysisStageIndex}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        currentRound && (
                            <SingleRoundView 
                                round={currentRound}
                                onModeSelect={handleModeSelect}
                                opponentType={activeCase.opponentType}
                                onNextRound={goToNext}
                                onPrint={handleDownload}
                                isLatest={viewIndex === rounds.length - 1}
                                userName={account?.name}
                                isDemo={isDemo}
                                demoHasNext={demoHasNext}
                            />
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
