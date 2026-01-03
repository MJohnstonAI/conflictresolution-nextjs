"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Info,
  PlayCircle,
  Fingerprint,
  Target,
  User,
  Shield,
  Scale,
  Mountain,
  Flame,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { Case, Mode, Round } from "@/types";
import { Button, Badge, RiskGauge } from "@/components/UI";
import { DEMO_SCENARIOS } from "@/services/demo_scenarios";
import { demoStore } from "@/services/demo_store";
import { toast } from "@/components/DesignSystem";

const MODE_ORDER: Mode[] = ["Peacekeeper", "Barrister", "Grey Rock", "Nuclear"];

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

const DemoToneSelector: React.FC<{
  mode: Mode;
  active: boolean;
  onClick: () => void;
}> = ({ mode, active, onClick }) => {
  const icons = {
    Peacekeeper: Shield,
    Barrister: Scale,
    Nuclear: Flame,
    "Grey Rock": Mountain,
  };
  const Icon = icons[mode];

  const activeStyles = {
    Peacekeeper: "bg-emerald-500/10 text-emerald-400 border-emerald-500/50",
    Barrister: "bg-blue-500/10 text-blue-400 border-blue-500/50",
    Nuclear: "bg-rose-500/10 text-rose-400 border-rose-500/50",
    "Grey Rock": "bg-slate-500/10 text-slate-300 border-slate-500/50",
  };

  const baseStyle =
    "flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all flex-1";
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

const DemoInputSection: React.FC<{
  roundNumber: number;
  inputText: string;
  opponentType: string;
  isAnalyzing: boolean;
  isClosed: boolean;
  demoHasNext: boolean;
  onPlay: () => void;
  error: string | null;
}> = ({ roundNumber, inputText, opponentType, isAnalyzing, isClosed, demoHasNext, onPlay, error }) => {
  const actionDisabled = isAnalyzing || isClosed || !demoHasNext;
  const actionLabel = demoHasNext
    ? roundNumber === 1
      ? "Play Demo Round 1"
      : "Play Next Demo Round"
    : "Demo Complete";

  return (
    <div className="bg-navy-950/70 border border-navy-800 shadow-[0_0_40px_-10px_rgba(15,23,42,0.4)] p-6 md:p-8 rounded-2xl w-full flex flex-col min-h-[520px]">
      <div className="space-y-3 flex-1 flex flex-col">
        <label className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-bold text-gold-500 uppercase tracking-widest pl-1 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              {`DEMO ROUND ${roundNumber} // READY TO PLAY`}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-slate-100">{opponentType}</span>
              <Badge color="gray">Target</Badge>
            </div>
          </div>
          <span className="text-[10px] text-slate-500">
            {inputText.length.toLocaleString()} / 20000
          </span>
        </label>

        <textarea
          value={inputText}
          readOnly
          disabled={isAnalyzing || isClosed}
          placeholder="Demo playback is read-only. Press play to reveal the next scripted message."
          className="w-full border rounded-2xl p-6 text-base outline-none transition-all resize-none flex-1 min-h-[360px] shadow-inner bg-navy-950 text-slate-100 placeholder-slate-500 border-navy-200/10"
        />
      </div>

      <div className="mt-8">
        <Button
          onClick={onPlay}
          fullWidth
          size="lg"
          disabled={actionDisabled}
          className="font-bold shadow-lg transition-all bg-gold-600 hover:bg-gold-500 text-navy-950 py-5 text-lg shadow-gold-500/20"
        >
          {isAnalyzing ? (
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 animate-spin" />
              <span>Loading Demo Round...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5" />
              <span>{actionLabel}</span>
            </div>
          )}
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-900/20 p-4 rounded-xl border border-rose-500/20 mt-4 animate-fade-in">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

const DemoRoundView: React.FC<{
  round: Round;
  onModeSelect: (mode: Mode) => void;
  onNextRound: () => void;
  onCompleteCta: () => void;
  isLatest: boolean;
  demoHasNext: boolean;
  opponentType: string;
}> = ({ round, onModeSelect, onNextRound, onCompleteCta, isLatest, demoHasNext, opponentType }) => {
  const [showRawText, setShowRawText] = useState(true);
  const [showWhy, setShowWhy] = useState(false);
  const [showWatchFor, setShowWatchFor] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [showMobileAnalysis, setShowMobileAnalysis] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const currentResponse =
    round.responses[
      round.selectedMode === "Peacekeeper"
        ? "soft"
        : round.selectedMode === "Barrister"
          ? "firm"
          : round.selectedMode === "Grey Rock"
            ? "greyRock"
            : "nuclear"
    ] || "";
  const riskSummary = getRiskSummary(round.legalRiskScore || 0);
  const isDemoComplete = isLatest && !demoHasNext;

  return (
    <div className="h-full animate-fade-in pb-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
        <div className={`flex-col gap-6 h-full min-h-0 overflow-hidden order-2 lg:order-1 ${showMobileAnalysis ? "flex" : "hidden lg:flex"}`}>
          <div className="bg-navy-900 border border-navy-800 rounded-xl overflow-hidden shadow-lg flex-shrink-0 flex flex-col max-h-[50%]">
            <div className="bg-navy-950 px-5 py-3 border-b border-navy-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Adversary's Narrative
                </span>
              </div>
              <button
                onClick={() => setShowRawText(!showRawText)}
                className="text-[10px] font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 uppercase tracking-wider"
              >
                {showRawText ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showRawText ? "Hide Raw" : "View Raw"}
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar bg-navy-900/50 relative">
              {showRawText ? (
                <div className="animate-fade-in">
                  <span className="text-[10px] font-bold text-slate-600 uppercase mb-2 block">
                    Original Transcript
                  </span>
                  <p className="text-slate-400 text-sm whitespace-pre-wrap font-mono leading-relaxed bg-navy-950/50 p-4 rounded-lg border border-navy-800/50">
                    {round.opponentText || "No narrative provided."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gold-500 uppercase tracking-wide block mb-1">
                    Key Conflict Points (Scripted Summary)
                  </span>
                  <p className="text-slate-200 text-base leading-relaxed whitespace-pre-wrap">
                    "{round.analysisSummary || "No summary available."}"
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-navy-900 border border-navy-800 rounded-xl overflow-hidden shadow-lg flex-1 flex flex-col min-h-0">
            <div className="bg-navy-950 px-5 py-3 border-b border-navy-800 flex items-center gap-2 shrink-0">
              <Activity className="w-4 h-4 text-gold-500" />
              <span className="text-xs font-bold text-gold-500 uppercase tracking-widest">Tactical Analysis</span>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              <div className="bg-navy-950/30 p-4 rounded-lg border border-navy-800/50">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-2">
                  Psychological Vibe
                </span>
                <p className="text-sm text-slate-200 font-medium">"{round.vibeCheck || "No vibe check provided."}"</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-2">
                  Detected Tactics
                </span>
                <div className="flex flex-wrap gap-2">
                  {round.detectedFallacies?.length ? (
                    round.detectedFallacies.map((f) => (
                      <span
                        key={f}
                        className="px-2.5 py-1 bg-rose-900/20 text-rose-300 border border-rose-500/20 rounded text-[10px] font-bold uppercase"
                      >
                        {f}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-600 italic">No overt manipulation detected.</span>
                  )}
                </div>
              </div>

              <RiskGauge score={round.legalRiskScore || 0} minLowFill={10} />

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

        <div className="flex flex-col bg-navy-900 border border-navy-800 rounded-xl overflow-hidden shadow-lg h-full order-1 lg:order-2">
          <div className="bg-navy-950 px-5 py-3 border-b border-navy-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Strategic Response</span>
            </div>
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
              {hasCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {hasCopied ? "Copied" : "Copy Text"}
            </button>
          </div>

          <div className="p-6 flex-1 flex flex-col min-h-0 gap-4">
            <button
              type="button"
              onClick={() => setShowMobileAnalysis((prev) => !prev)}
              className="lg:hidden inline-flex items-center justify-center gap-2 rounded-lg border border-navy-800 bg-navy-950/40 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:bg-navy-900/60 transition-colors"
            >
              {showMobileAnalysis ? "Hide Analysis" : "Show Analysis"}
            </button>

            <div className="bg-navy-950/40 p-3 rounded-lg border border-navy-800/50 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-full bg-navy-800 border border-gold-500/20 flex items-center justify-center text-gold-500">
                <Activity className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-400">
                  Hi <span className="text-slate-100 font-bold">Guest</span>, copy this response to your{" "}
                  <span className="text-gold-500 font-bold">{opponentType}</span>
                </p>
                <p className="text-[11px] text-slate-500">Drafts are read-only for safety. Copy to personalize.</p>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              {MODE_ORDER.map((m) => (
                <DemoToneSelector key={m} mode={m} active={round.selectedMode === m} onClick={() => onModeSelect(m)} />
              ))}
            </div>

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
                  {showWhy ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
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
                  <div className="text-base font-semibold uppercase tracking-widest text-slate-500">In plain English</div>
                  <div>
                    This draft uses a{" "}
                    <span className="text-slate-100 font-semibold">{round.selectedMode}</span> tone {" "}
                    {getModePlainLanguage(round.selectedMode)} to keep you aligned with your goal:{" "}
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
                      <span className="text-slate-200 font-semibold">{round.detectedFallacies.join(", ")}</span>,
                      consider switching tones (e.g., <span className="text-slate-200 font-semibold">Barrister</span>) to stay factual.
                    </div>
                  ) : null}
                  <div className="text-slate-500">
                    Tip: If anything here touches legal or safety issues, consult a qualified professional before sending.
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 relative group">
              <textarea
                readOnly
                className="w-full h-full bg-navy-950 text-slate-200 border border-navy-800 rounded-xl p-5 text-base leading-relaxed resize-none focus:outline-none focus:border-gold-500/30 custom-scrollbar"
                value={currentResponse}
              />
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-[10px] bg-navy-900 text-slate-500 px-2 py-1 rounded border border-navy-700">
                  Read-Only Preview
                </span>
              </div>
            </div>

            <div className="pt-2 shrink-0">
              <Button
                fullWidth
                size="lg"
                onClick={isDemoComplete ? onCompleteCta : onNextRound}
                disabled={isDemoComplete ? false : isLatest && !demoHasNext}
                className="flex justify-between items-center group bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-blue-500/20 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>
                  {isDemoComplete ? "Enjoyed the demo? Click here to Unlock Full Access for your own scenarios" : isLatest ? "Play Next Demo Round" : "View Next Round"}
                </span>
                <div className="flex items-center gap-2">
                  {!isDemoComplete && (
                    <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                  )}
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DemoWarRoom: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : undefined;
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [viewIndex, setViewIndex] = useState(0);
  const [inputMode, setInputMode] = useState(true);
  const analyzeInFlight = useRef(false);

  const demoScenario = useMemo(
    () => (activeCase?.demoScenarioId ? DEMO_SCENARIOS[activeCase.demoScenarioId] : undefined),
    [activeCase?.demoScenarioId]
  );

  const demoHasNext = !!demoScenario?.rounds[rounds.length];

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const c = await demoStore.getCase(id);
      if (!c) {
        router.push("/demo");
        return;
      }
      const r = await demoStore.getRounds(id);
      setActiveCase(c);
      setRounds(r);
      if (r.length > 0) {
        setViewIndex(r.length - 1);
        setInputMode(false);
      } else {
        setViewIndex(0);
        setInputMode(true);
      }
      setLoading(false);
    };
    load();
  }, [id, router]);

  useEffect(() => {
    if (!demoScenario) return;
    const nextRound = demoScenario.rounds[rounds.length];
    setInputText(nextRound ? nextRound.opponentText : "");
  }, [demoScenario, rounds.length]);

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
        await demoStore.saveCase(closedCase);
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
      await demoStore.saveCase(closedCase);
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
      senderIdentity: activeCase.opponentType,
      userGoal: "Hold boundaries",
      isAnalyzed: true,
      selectedMode: "Peacekeeper",
      rerollsUsed: 0,
      modelSlug: "demo-script",
      ...analysis,
    };

    await demoStore.saveRound(newRound);
    const updatedCase = { ...activeCase, roundsUsed: roundsUsedCount + 1, roundsLimit };
    await demoStore.saveCase(updatedCase);

    const updatedRounds = [...rounds, newRound];
    setRounds(updatedRounds);
    setActiveCase(updatedCase);
    setAnalysisError(null);
    setViewIndex(updatedRounds.length - 1);
    setInputMode(false);
  };

  const handlePlay = async () => {
    if (isAnalyzing || analyzeInFlight.current) return;
    analyzeInFlight.current = true;
    setIsAnalyzing(true);
    try {
      await appendDemoRound();
    } finally {
      setIsAnalyzing(false);
      analyzeInFlight.current = false;
    }
  };

  const handleModeSelect = async (mode: Mode) => {
    const current = rounds[viewIndex];
    if (!current) return;
    const updated = { ...current, selectedMode: mode };
    const newRounds = [...rounds];
    newRounds[viewIndex] = updated;
    setRounds(newRounds);
    await demoStore.saveRound(updated);
  };

  const handleNextRound = () => {
    if (viewIndex < rounds.length - 1) {
      setViewIndex(viewIndex + 1);
      return;
    }
    if (demoHasNext) {
      handlePlay();
    }
  };

  const handleSignupCta = () => {
    router.push("/auth?view=signup");
  };

  const goToNext = () => {
    if (inputMode) return;
    handleNextRound();
  };

  const goToPrev = () => {
    if (inputMode) {
      if (rounds.length > 0) {
        setInputMode(false);
        setViewIndex(rounds.length - 1);
      }
      return;
    }
    if (viewIndex > 0) {
      setViewIndex(viewIndex - 1);
      return;
    }
    setInputMode(true);
  };

  if (loading || !activeCase) {
    return (
      <div className="flex items-center justify-center h-screen bg-navy-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  const currentRound = !inputMode ? rounds[viewIndex] : null;
  const viewLabel = inputMode ? "Evidence" : "Results";

  return (
    <div className="w-full h-full">
      <div className="print-hidden flex flex-col h-full max-w-[1600px] mx-auto px-4 md:px-8 pb-6 w-full overflow-hidden">
        <div className="py-4 flex flex-col gap-4 border-b border-navy-800 shrink-0">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <button onClick={() => router.push("/demo")} className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-xl font-serif font-bold text-slate-100 max-w-[260px] md:max-w-md truncate">
                    {activeCase.title}
                  </h1>
                  <Badge color="gray">Demo</Badge>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToPrev}
                      className="p-2 rounded-lg border border-navy-800 bg-navy-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      disabled={inputMode && rounds.length === 0}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-widest font-mono">
                        <span className="text-slate-100">Case Demo</span>
                        <span className="text-slate-500">{viewLabel} > Round {inputMode ? rounds.length + 1 : viewIndex + 1}</span>
                      </div>
                    </div>
                    <button
                      onClick={goToNext}
                      className="p-2 rounded-lg border border-navy-800 bg-navy-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      disabled={!inputMode && viewIndex >= rounds.length - 1 && !demoHasNext}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1 truncate">
                  Model: <span className="text-slate-400">demo-script</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-between md:justify-end">
              <button
                onClick={handlePlay}
                disabled={!demoHasNext || isAnalyzing || activeCase.isClosed}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-gold-600 hover:bg-gold-500 text-navy-950 text-xs font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PlayCircle className="w-4 h-4" />
                {demoHasNext ? "Play Next Round" : "Demo Complete"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 relative pt-4">
          {inputMode ? (
            <div className="h-full overflow-y-auto custom-scrollbar">
              <div className="h-full flex flex-col items-center max-w-6xl mx-auto pt-4 pb-10 gap-6">
                <div className="w-full bg-navy-900 border border-navy-800 rounded-2xl p-5 relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Target className="w-24 h-24 text-gold-500" />
                  </div>
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="p-3 bg-navy-950 rounded-lg border border-navy-800">
                      <Fingerprint className="w-6 h-6 text-gold-500" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gold-500 uppercase tracking-widest">
                        03 Mission Profile
                      </span>
                      <p className="text-slate-400 text-sm italic mt-1 line-clamp-2">
                        "{activeCase.note || "No context provided."}"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full bg-navy-900 border border-navy-800 rounded-2xl shrink-0">
                  <div className="px-5 pt-5 grid gap-4 text-[10px] font-bold text-gold-500 uppercase tracking-widest md:grid-cols-[320px_minmax(0,1fr)] md:items-center">
                    <span>04 Adversary</span>
                    <label className="pl-1">Specify Adversary Name</label>
                  </div>
                  <div className="p-5 pt-3 grid gap-4 md:grid-cols-[320px_minmax(0,1fr)] md:items-center">
                    <div className="rounded-xl border border-navy-800 bg-navy-950 px-4 py-3 text-sm text-slate-200">
                      {activeCase.opponentType}
                    </div>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        aria-label="Adversary name"
                        placeholder={`${activeCase.opponentType}'s Name (Scripted)`}
                        value=""
                        disabled
                        className="w-full bg-navy-950 border border-navy-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="w-full flex-1 min-h-[520px]">
                  <DemoInputSection
                    inputText={inputText}
                    opponentType={activeCase.opponentType}
                    roundNumber={rounds.length + 1}
                    isAnalyzing={isAnalyzing}
                    isClosed={activeCase.isClosed}
                    demoHasNext={demoHasNext}
                    onPlay={handlePlay}
                    error={analysisError}
                  />
                </div>
              </div>
            </div>
          ) : (
            currentRound && (
              <DemoRoundView
                round={currentRound}
                onModeSelect={handleModeSelect}
                onNextRound={handleNextRound}
                onCompleteCta={handleSignupCta}
                isLatest={viewIndex === rounds.length - 1}
                demoHasNext={demoHasNext}
                opponentType={activeCase.opponentType}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};

