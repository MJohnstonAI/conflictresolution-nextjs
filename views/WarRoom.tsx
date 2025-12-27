
"use client";

import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, RefreshCw, AlertTriangle, Shield, Scale, Mountain, Flame, ArrowLeft, Home, Copy, Info, Target, Fingerprint, Activity, ChevronLeft, ChevronRight, Download, Eye, EyeOff, Printer, FileText, PlayCircle } from 'lucide-react';
import { store } from '../services/store';
import { analyzeConflict, reviseResponse, summarizeCase } from '../services/ai';
import { exportService } from '../services/export';
import { Case, Round, Mode, UserAccount } from '../types';
import { Button, Badge, RiskGauge } from '../components/UI';
import { toast } from '../components/DesignSystem';
import { DEMO_SCENARIOS } from '../services/demo_scenarios';
import { setRouteState } from '@/lib/route-state';
import { getClientAuthHeaders } from '@/lib/client/auth-headers';

const MAX_OPPONENT_MESSAGE_CHARS = 15000;
const WARN_OPPONENT_MESSAGE_CHARS = 13500;

const getResponseKey = (mode: Mode) =>
    mode === 'Peacekeeper' ? 'soft' : mode === 'Barrister' ? 'firm' : mode === 'Grey Rock' ? 'greyRock' : 'nuclear';

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
    isDemo?: boolean;
    demoHasNext?: boolean;
}

const InputSection: React.FC<InputSectionProps> = memo(({ 
    inputText, setInputText, senderName, setSenderName, isAnalyzing, isCaseClosed, analysisError, setAnalysisError, activeCase, onSubmit, roundNumber, isHero = false, isDemo = false, demoHasNext = true
}) => {
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<number | null>(null);
    const [limitNotice, setLimitNotice] = useState<string | null>(null);
    const [isSummarizingMessage, setIsSummarizingMessage] = useState(false);

    const charsUsed = inputText.length;
    const isNearLimit = !isDemo && charsUsed >= WARN_OPPONENT_MESSAGE_CHARS;
    const isAtLimit = !isDemo && charsUsed >= MAX_OPPONENT_MESSAGE_CHARS;

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
        ? `w-full border border-navy-700 rounded-xl p-6 text-lg outline-none transition-all resize-none flex-1 min-h-[200px] focus:border-gold-500/50 focus:shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] ${
            isDemo
                ? "bg-navy-950 text-slate-100 placeholder-slate-500"
                : "bg-navy-950/50 text-slate-200 placeholder-slate-600 focus:bg-navy-950"
        }`
        : `w-full bg-navy-900 border rounded-2xl p-6 text-base text-slate-300 placeholder-slate-500 outline-none transition-all resize-none flex-1 min-h-[300px] shadow-inner ${
            isDemo ? "bg-navy-950 text-slate-100 placeholder-slate-500" : ""
        } ${isTyping ? 'border-gold-500/50 shadow-[0_0_15px_-3px_rgba(245,158,11,0.15)]' : analysisError ? 'border-rose-500/50' : 'border-navy-800 focus:border-gold-500/30'}`;

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

    const actionDisabled =
        isAnalyzing || isSummarizingMessage || isCaseClosed || (isDemo ? !demoHasNext : !inputText.trim());

    const isTransientError =
        !!analysisError && /Error (429|502|503|504)|timed out|timeout/i.test(analysisError);
    const requestIdMatch = analysisError?.match(/Request ID:\s*([^\s]+)/i);
    const requestId = requestIdMatch?.[1];

    const summarizeMessageToLimit = async (rawText: string) => {
        setIsSummarizingMessage(true);
        setLimitNotice(
            `Message limit exceeded. Summarizing with the premium model to fit within ${MAX_OPPONENT_MESSAGE_CHARS.toLocaleString()} characters...`
        );
        toast(
            `Message exceeds ${MAX_OPPONENT_MESSAGE_CHARS.toLocaleString()} characters. Summarizing with the premium model...`,
            "info"
        );
        try {
            const authHeaders = await getClientAuthHeaders();
            const response = await fetch("/api/message-summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders },
                body: JSON.stringify({ text: rawText, limit: MAX_OPPONENT_MESSAGE_CHARS }),
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                const message =
                    payload?.error?.message ||
                    (typeof payload?.message === "string" ? payload.message : null) ||
                    `Request failed with ${response.status}`;
                throw new Error(message);
            }
            const nextText = payload?.data?.text;
            if (typeof nextText === "string" && nextText.trim()) {
                setInputText(nextText.slice(0, MAX_OPPONENT_MESSAGE_CHARS));
                setLimitNotice(
                    `Message was summarized to fit within ${MAX_OPPONENT_MESSAGE_CHARS.toLocaleString()} characters.`
                );
                toast("Message summarized to fit within the limit.", "success");
                return;
            }
            throw new Error("No summary returned");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to summarise message";
            toast(message, "error");
            setInputText(rawText.slice(0, MAX_OPPONENT_MESSAGE_CHARS));
            setLimitNotice(
                `Summarization failed; the message was truncated to ${MAX_OPPONENT_MESSAGE_CHARS.toLocaleString()} characters.`
            );
        } finally {
            setIsSummarizingMessage(false);
        }
    };

    const handleMessagePaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
        if (isDemo) return;
        const pasted = event.clipboardData.getData("text");
        if (!pasted) return;
        if (isSummarizingMessage) {
            event.preventDefault();
            return;
        }

        const el = event.currentTarget;
        const start = el.selectionStart ?? inputText.length;
        const end = el.selectionEnd ?? inputText.length;
        const next = inputText.slice(0, start) + pasted + inputText.slice(end);
        if (next.length <= MAX_OPPONENT_MESSAGE_CHARS) {
            setLimitNotice(null);
            return;
        }

        event.preventDefault();
        await summarizeMessageToLimit(next);
    };

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
                        {isDemo
                            ? `DEMO ROUND ${roundNumber} // READY TO PLAY`
                            : isHero
                                ? "AWAITING TRANSMISSION (EVIDENCE)"
                                : `ROUND ${roundNumber} // AWAITING INPUT`}
                    </span>
                    <span
                        className={`text-[10px] font-mono ${
                            isAtLimit ? "text-amber-400" : isNearLimit ? "text-slate-300" : "text-slate-500"
                        }`}
                    >
                        {charsUsed.toLocaleString()} / {MAX_OPPONENT_MESSAGE_CHARS.toLocaleString()}
                    </span>
                </label>
                
                <textarea 
                    value={inputText}
                    onChange={(e) => {
                        if (isDemo) return;
                        const nextRaw = e.target.value;
                        if (nextRaw.length > MAX_OPPONENT_MESSAGE_CHARS) {
                            setInputText(nextRaw.slice(0, MAX_OPPONENT_MESSAGE_CHARS));
                            setLimitNotice(
                                `Message capped at ${MAX_OPPONENT_MESSAGE_CHARS.toLocaleString()} characters. Split long emails across multiple rounds.`
                            );
                            return;
                        }
                        setInputText(nextRaw);
                        if (limitNotice) setLimitNotice(null);
                        if (analysisError) setAnalysisError(null);
                    }}
                    onPaste={handleMessagePaste}
                    placeholder={placeholderText}
                    className={textareaClasses}
                    readOnly={isDemo}
                    disabled={isAnalyzing || isCaseClosed}
                />
                {(limitNotice || isNearLimit) && (
                    <div className="text-[10px] font-mono text-slate-400 px-1">
                        {limitNotice ||
                            `Approaching the ${MAX_OPPONENT_MESSAGE_CHARS.toLocaleString()} character limit. Consider splitting long messages across rounds.`}
                    </div>
                )}
            </div>

            <div className={isHero ? "mt-8" : "mt-6"}>
                <Button 
                    onClick={onSubmit}
                    fullWidth 
                    size="lg" 
                    disabled={actionDisabled}
                    className={`font-bold shadow-lg transition-all ${isHero ? 'bg-gold-600 hover:bg-gold-500 text-navy-950 py-5 text-lg shadow-gold-500/20' : 'bg-gold-600 hover:bg-gold-500 text-navy-950 shadow-gold-500/20'}`}
                >
                    {isAnalyzing || isSummarizingMessage ? (
                        <div className="flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span>
                                {isSummarizingMessage
                                    ? "Summarizing Message..."
                                    : isDemo
                                      ? "Loading Demo Round..."
                                      : "Analyzing Psychology..."}
                            </span>
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
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-rose-400 text-sm bg-rose-900/20 p-4 rounded-xl border border-rose-500/20 mt-4 animate-fade-in">
                    <div className="flex items-start gap-2 flex-1">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <div>{analysisError}</div>
                            {requestId && (
                                <div className="text-[10px] font-mono text-rose-300/80 mt-1">
                                    Request ID: {requestId}
                                </div>
                            )}
                        </div>
                    </div>
                    {isTransientError && !isDemo && (
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={isAnalyzing || isSummarizingMessage || isCaseClosed}
                            className="px-3 py-2 rounded-lg border border-rose-500/40 text-rose-100 hover:text-white hover:border-rose-400 transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
                        >
                            Retry Analysis
                        </button>
                    )}
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
    onRefine: (id: string, instruction: string) => Promise<void>;
    opponentType: string;
    onNextRound: () => void;
    isLatest: boolean;
    userName?: string;
    isDemo?: boolean;
    demoHasNext?: boolean;
    canRefine?: boolean;
}> = ({
    round,
    onModeSelect,
    onRefine,
    opponentType,
    onNextRound,
    isLatest,
    userName,
    isDemo = false,
    demoHasNext = true,
    canRefine = true
}) => {

    const [showRawText, setShowRawText] = useState(isDemo);
    const [refineInstruction, setRefineInstruction] = useState("");
    const [isRefining, setIsRefining] = useState(false);
    const [refineError, setRefineError] = useState<string | null>(null);

    // Helper to get current response text
    const currentResponse = round.responses[getResponseKey(round.selectedMode)] || "";

    const handleRefine = async () => {
        const instruction = refineInstruction.trim();
        if (!instruction) return;
        setIsRefining(true);
        setRefineError(null);
        try {
            await onRefine(round.id, instruction);
            setRefineInstruction("");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to refine response";
            setRefineError(message);
        } finally {
            setIsRefining(false);
        }
    };

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

                        {/* Refine Response */}
                        <div className="bg-navy-950/40 p-3 rounded-lg border border-navy-800/50 space-y-2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Refine Response
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={refineInstruction}
                                    onChange={(event) => setRefineInstruction(event.target.value)}
                                    placeholder="e.g. Make it shorter and firmer."
                                    disabled={!canRefine || isRefining}
                                    className="flex-1 bg-navy-950 border border-navy-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:ring-1 focus:ring-gold-500/40 focus:border-gold-500/40 disabled:opacity-60"
                                />
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={handleRefine}
                                    disabled={!canRefine || isRefining || !refineInstruction.trim()}
                                    className="whitespace-nowrap"
                                >
                                    {isRefining ? "Refining..." : "Refine"}
                                </Button>
                            </div>
                            {refineError && (
                                <div className="text-[10px] text-rose-300">{refineError}</div>
                            )}
                            {!canRefine && (
                                <div className="text-[10px] text-slate-500">
                                    Refinement is unavailable for demo or closed cases.
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
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [isStartingPart2, setIsStartingPart2] = useState(false);
    const analyzeInFlight = useRef(false);
    const demoScenario = useMemo(
        () => (activeCase?.demoScenarioId ? DEMO_SCENARIOS[activeCase.demoScenarioId] : undefined),
        [activeCase?.demoScenarioId]
    );
    const isDemo = !!activeCase?.demoScenarioId && activeCase?.planType === "demo";

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

            setAllCases(cases);
            setActiveCase(caseData);
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

    useEffect(() => {
        if (!isDemo || !demoScenario) return;
        const nextRound = demoScenario.rounds[rounds.length];
        setInputText(nextRound ? nextRound.opponentText : "");
    }, [isDemo, demoScenario, rounds.length]);

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
            const roundsLimit =
                activeCase.roundsLimit || (activeCase.planType === "premium" ? 40 : 10);
            const roundsUsedCount = Math.max(activeCase.roundsUsed, rounds.length);

            if (roundsUsedCount >= roundsLimit && !activeCase.isClosed) {
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
            const updatedCase = { ...activeCase, roundsUsed: roundsUsedCount + 1, roundsLimit };
            await store.saveCase(updatedCase);
            
            const updatedRounds = [...rounds, newRound];
            setRounds(updatedRounds);
            setActiveCase(updatedCase);
            setInputText("");
            
            // Auto-switch view to the result we just generated
            setViewIndex(updatedRounds.length - 1); 
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

    const handleRefineResponse = async (roundId: string, instruction: string) => {
        if (!activeCase) return;
        const idx = rounds.findIndex(r => r.id === roundId);
        if (idx === -1) return;
        const round = rounds[idx];
        const responseKey = getResponseKey(round.selectedMode);
        const originalText = round.responses[responseKey] || "";
        if (!originalText.trim()) {
            throw new Error("No draft available to refine.");
        }
        const revised = await reviseResponse(
            originalText,
            instruction,
            activeCase.planType,
            activeCase.id
        );
        const updatedRound: Round = {
            ...round,
            responses: { ...round.responses, [responseKey]: revised }
        };
        const updatedRounds = [...rounds];
        updatedRounds[idx] = updatedRound;
        setRounds(updatedRounds);
        await store.saveRound(updatedRound);
        toast("Response refined.", "success");
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

    const handleDownloadMarkdown = () => {
        if (!activeCase) return;
        toast("Generating markdown file...", "info");
        exportService.downloadMarkdown(activeCase, rounds);
        toast("Download started.", "success");
    };

    const handleStartPart2 = async () => {
        if (!activeCase) return;
        if (activeCase.planType === "demo") return;
        if (isStartingPart2) return;

        setIsStartingPart2(true);
        toast("Summarizing this case for Part 2...", "info");
        try {
            const summary = await summarizeCase(rounds, activeCase);
            const seedText = `Part 2 Case Note (summary of the previous case):\n\n${summary}`.trim();
            setRouteState("/", { templateText: seedText });
            router.push("/");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Failed to summarize case";
            toast(message, "error");
        } finally {
            setIsStartingPart2(false);
        }
    };

    if (loading || !activeCase) return <div className="flex items-center justify-center h-screen bg-navy-950"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div></div>;

    // Determine current view mode
    const isInputMode = viewIndex === rounds.length;
    const currentRound = !isInputMode ? rounds[viewIndex] : null;

    // Stats for Progress Bar
    const roundsLimit = activeCase.roundsLimit || (activeCase.planType === "premium" ? 40 : 10);
    const roundsUsedCount = Math.max(rounds.length, activeCase.roundsUsed);
    const remainingCount = Math.max(0, roundsLimit - roundsUsedCount);
    const progressPercentage = (roundsUsedCount / roundsLimit) * 100;
    const displayRound = isInputMode ? rounds.length : (viewIndex + 1);
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
                <div className="py-4 flex items-center justify-between border-b border-navy-800 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/vault')}
                            aria-label="Back to Vault"
                            className="text-slate-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-gold-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 rounded"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-serif font-bold text-slate-100 max-w-[200px] md:max-w-md truncate">{activeCase.title}</h1>
                                {activeCase.planType === 'premium' && <Badge color="amber">Premium</Badge>}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-1 truncate">
                                Model: <span className="text-slate-400">{activeModelSlug}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        aria-label="Go to Start New Case"
                        className="p-2 rounded-full hover:bg-navy-900 text-slate-400 hover:text-gold-400 focus-visible:ring-2 focus-visible:ring-gold-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
                    >
                        <Home className="w-5 h-5" />
                    </button>
                </div>

                {/* 2. NAVIGATION BAR & PROGRESS TRACKER (Combined for visual density) */}
                <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 border-b border-navy-800/50 mb-4">
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={goToPrev} 
                            disabled={viewIndex === 0}
                            aria-label="Previous round"
                            className="p-2 rounded-lg border border-navy-800 bg-navy-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all focus-visible:ring-2 focus-visible:ring-gold-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
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
                            aria-label="Next round"
                            className="p-2 rounded-lg border border-navy-800 bg-navy-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all focus-visible:ring-2 focus-visible:ring-gold-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
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

                {isDemo && !demoHasNext && (
                    <div className="mb-4 bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest font-mono">
                                Demo Complete
                            </div>
                            <p className="text-sm text-slate-100 font-semibold mt-1">
                                Ready to start a real case with full AI analysis?
                            </p>
                            <p className="text-xs text-slate-300 mt-1">
                                Your demo never called the AI. Create a case to generate real responses.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                                onClick={() => router.push("/")}
                                className="bg-blue-600 hover:bg-blue-500 text-white border-none"
                            >
                                Start a Real Case
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => router.push("/auth")}
                                className="text-blue-200 hover:text-white"
                            >
                                Sign In / Join
                            </Button>
                        </div>
                    </div>
                )}

                {!isDemo && (activeCase.isClosed || remainingCount === 0) && (
                    <div className="mb-4 bg-navy-900 border border-gold-500/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="min-w-0">
                            <div className="text-[10px] font-bold text-gold-500 uppercase tracking-widest font-mono">
                                Case Closed
                            </div>
                            <p className="text-sm text-slate-200 font-semibold mt-1">
                                You've reached this case's round limit.
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                Export your file, or start a Part 2 with a summary of this case.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button
                                type="button"
                                onClick={handleDownloadMarkdown}
                                className="px-4 py-2 rounded-lg bg-navy-950 text-slate-200 border border-navy-800 hover:border-navy-700 hover:bg-navy-900 transition-all text-sm font-bold flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-gold-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
                            >
                                <FileText className="w-4 h-4" /> Markdown
                            </button>
                            <button
                                type="button"
                                onClick={handleDownload}
                                className="px-4 py-2 rounded-lg bg-navy-950 text-slate-200 border border-navy-800 hover:border-navy-700 hover:bg-navy-900 transition-all text-sm font-bold flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-gold-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950"
                            >
                                <Printer className="w-4 h-4" /> Print / PDF
                            </button>
                            <Button
                                type="button"
                                onClick={handleStartPart2}
                                disabled={isStartingPart2}
                                className="bg-gold-600 hover:bg-gold-500 text-navy-950 font-bold border-none flex items-center justify-center gap-2"
                            >
                                {isStartingPart2 ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                                Start Part 2
                            </Button>
                        </div>
                    </div>
                )}

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
                                         isDemo={isDemo}
                                         demoHasNext={demoHasNext}
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
                                     isDemo={isDemo}
                                     demoHasNext={demoHasNext}
                                 />
                            )}
                         </div>
                    ) : (
                        currentRound && (
                            <SingleRoundView 
                                round={currentRound}
                                onModeSelect={handleModeSelect}
                                onRefine={handleRefineResponse}
                                opponentType={activeCase.opponentType}
                                onNextRound={goToNext}
                                isLatest={viewIndex === rounds.length - 1}
                                userName={account?.name}
                                isDemo={isDemo}
                                demoHasNext={demoHasNext}
                                canRefine={!isDemo && !activeCase.isClosed}
                            />
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
