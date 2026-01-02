"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/DesignSystem";
import { store } from "@/services/store";
import { Case, PlanType } from "@/types";
import {
  ArrowRight,
  Crown,
  Loader2,
  User,
  Zap,
} from "lucide-react";
import { consumeRouteState } from "@/lib/route-state";

const CONTEXT_LIMIT_CHARS = 40000;
const MIN_RECOMMEND_CHARS = 220;
const MIN_RECOMMEND_WORDS = 35;

const SEO: React.FC<{ title: string }> = ({ title }) => {
  useEffect(() => {
    document.title = `${title} | Conflict Resolution`;
  }, [title]);
  return null;
};

type PackageChoice = Extract<PlanType, "standard" | "premium">;

const PREMIUM_KEYWORDS = [
  "lawsuit",
  "court",
  "attorney",
  "lawyer",
  "legal",
  "custody",
  "divorce",
  "restraining order",
  "eviction",
  "contract",
  "settlement",
  "harassment",
  "threat",
  "police",
  "fraud",
  "invoice",
  "payment",
  "insurance",
  "termination",
  "discrimination",
  "abuse",
  "assault",
  "stalking",
  "foreclosure",
  "debt",
];

const STANDARD_KEYWORDS = [
  "roommate",
  "friend",
  "neighbor",
  "family",
  "coworker",
  "co-worker",
  "partner",
  "boyfriend",
  "girlfriend",
  "misunderstanding",
  "communication",
  "boundary",
  "apology",
  "schedule",
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const countKeywordHits = (content: string, keywords: string[]) => {
  let hits = 0;
  for (const keyword of keywords) {
    if (keyword.includes(" ")) {
      if (content.includes(keyword)) hits += 1;
      continue;
    }
    const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i");
    if (regex.test(content)) hits += 1;
  }
  return hits;
};

const getPackageRecommendation = (rawText: string): PackageChoice | null => {
  const trimmed = rawText.trim();
  if (!trimmed) return null;
  if (trimmed.length < MIN_RECOMMEND_CHARS) return null;
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  if (wordCount < MIN_RECOMMEND_WORDS) return null;

  const normalized = trimmed.toLowerCase();
  const premiumHits = countKeywordHits(normalized, PREMIUM_KEYWORDS);
  const standardHits = countKeywordHits(normalized, STANDARD_KEYWORDS);

  if (premiumHits >= 2) return "premium";
  if (premiumHits === 1 && standardHits === 0) return "premium";
  if (standardHits >= 2 && premiumHits === 0) return "standard";
  return null;
};

const Home: React.FC = () => {
  const router = useRouter();
  const [text, setText] = useState("");
  const [isSummarizingContext, setIsSummarizingContext] = useState(false);
  const [contextNotice, setContextNotice] = useState<string | null>(null);
  const [prefillOpponent, setPrefillOpponent] = useState<string | null>(null);
  const [standardSessions, setStandardSessions] = useState(0);
  const [premiumSessions, setPremiumSessions] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<PackageChoice>("standard");
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isStartingAnalysis, setIsStartingAnalysis] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const state = consumeRouteState<{ templateText?: string; opponentType?: string }>("/");
    if (state?.templateText) setText(state.templateText);
    if (state?.opponentType) setPrefillOpponent(state.opponentType);

    store.getAccount().then((acc) => {
      if (acc.name) setUserName(acc.name);
      setStandardSessions(acc.standardSessions || 0);
      setPremiumSessions(acc.premiumSessions || 0);
    });
  }, []);

  useEffect(() => {
    if (!sessionError) return;
    const selectedSessions = selectedPackage === "standard" ? standardSessions : premiumSessions;
    if (selectedSessions > 0) {
      setSessionError(null);
    }
  }, [selectedPackage, premiumSessions, sessionError, standardSessions]);

  const handleAnalyzeStart = async () => {
    if (isAnalyzeDisabled) return;
    const sessionsRemaining = selectedPackage === "standard" ? standardSessions : premiumSessions;
    if (sessionsRemaining <= 0) {
      const message =
        selectedPackage === "standard"
          ? "No session credits available for Standard package. Click here to purchase Standard sessions to begin."
          : "No session credits available for Premium package. Click here to purchase Premium sessions to begin.";
      setSessionError(message);
      toast(message, "error");
      return;
    }
    setSessionError(null);
    setIsStartingAnalysis(true);
    try {
      await createCase(selectedPackage);
    } finally {
      setIsStartingAnalysis(false);
    }
  };

  const createCase = async (tier: PlanType) => {
    const limit = tier === "demo" ? 3 : 0;
    if (tier === "demo") {
      router.push("/demo");
      return;
    }
    const finalOpponent = prefillOpponent?.trim() || "Other";
    const title =
      finalOpponent && finalOpponent !== "Other" ? `${finalOpponent} Conflict Case` : "Conflict Case";
    const newCase: Case = {
      id: crypto.randomUUID(),
      title,
      opponentType: finalOpponent,
      createdAt: new Date().toISOString(),
      roundsLimit: limit,
      roundsUsed: 0,
      planType: tier,
      isClosed: false,
      note: text.slice(0, CONTEXT_LIMIT_CHARS),
    };
    await store.saveCase(newCase);
    router.push(`/case/${newCase.id}`);
  };

  const isAnalyzeDisabled =
    isStartingAnalysis || isSummarizingContext || !text.trim();
  const standardUnavailable = standardSessions <= 0;
  const premiumUnavailable = premiumSessions <= 0;
  const selectedSessions = selectedPackage === "standard" ? standardSessions : premiumSessions;
  const showPackageNotice = selectedSessions <= 0 || !!sessionError;
  const purchaseLabel =
    selectedPackage === "standard" ? "Purchase Standard sessions" : "Purchase Premium sessions";
  const packageRecommendation = useMemo(() => getPackageRecommendation(text), [text]);
  const showRecommendation = Boolean(packageRecommendation && selectedPackage !== "premium");
  const showStandardRecommendation = showRecommendation && packageRecommendation === "standard";
  const showPremiumRecommendation = showRecommendation && packageRecommendation === "premium";

  const summarizeContextToLimit = async (rawText: string) => {
    setIsSummarizingContext(true);
    setContextNotice("Input exceeds limits and will be summarised with Claude Sonnet 4.5.");
    toast("Input exceeds 40,000 characters. Summarizing with Claude Sonnet 4.5...", "info");
    try {
      const response = await fetch("/api/context-summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText, limit: CONTEXT_LIMIT_CHARS }),
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
        setText(nextText.slice(0, CONTEXT_LIMIT_CHARS));
        setContextNotice("Your input was summarised to fit within 40,000 characters.");
        toast("Context summarised to fit within 40,000 characters.", "success");
        return;
      }
      throw new Error("No summary returned");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to summarise context";
      toast(message, "error");
      setText(rawText.slice(0, CONTEXT_LIMIT_CHARS));
      setContextNotice("Summarisation failed; your input was truncated to 40,000 characters.");
    } finally {
      setIsSummarizingContext(false);
    }
  };

  const handleContextPaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = event.clipboardData.getData("text");
    if (!pasted) return;
    if (isSummarizingContext) {
      event.preventDefault();
      return;
    }

    const el = event.currentTarget;
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.slice(0, start) + pasted + text.slice(end);
    if (next.length <= CONTEXT_LIMIT_CHARS) {
      setContextNotice(null);
      return;
    }

    event.preventDefault();
    await summarizeContextToLimit(next);
  };

  return (
    <div className="flex flex-col animate-fade-in w-full h-full">
      <SEO title="Start New Case" />

      {userName && (
        <div className="bg-navy-900 border-b border-navy-800 px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gold-500/10 flex items-center justify-center border border-gold-500/20">
            <User className="w-4 h-4 text-gold-500" />
          </div>
          <p className="text-sm font-bold text-slate-100">
            Hi <span className="text-gold-500">{userName}</span>, welcome back
          </p>
        </div>
      )}

      <div className="pt-8 pb-6 text-center px-6 md:text-left md:px-10">
        <h1 className="flex flex-wrap items-baseline justify-center md:justify-start gap-2 text-3xl tracking-tight text-slate-100 md:text-4xl">
          <span className="font-serif font-bold text-gold-400">Start New Case</span>
          <span className="text-sm text-slate-300 font-normal">
            - Describe the situation to begin.
          </span>
        </h1>
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto px-5 md:px-10 pb-24 md:pb-10 flex flex-col gap-6">
        <div className="space-y-3 flex flex-col flex-1">
          <div className="flex items-center justify-between gap-3">
            <label className="text-[10px] font-bold uppercase tracking-widest pl-1 case-step-label">
              01 Describe the Conflict Case
            </label>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {text.length.toLocaleString()} / {CONTEXT_LIMIT_CHARS.toLocaleString()}
            </span>
          </div>
          {contextNotice && (
            <div className="text-xs text-gold-400/90 border border-gold-500/20 bg-gold-500/5 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span>{contextNotice}</span>
                {isSummarizingContext && <Loader2 className="w-4 h-4 animate-spin text-gold-400" />}
              </div>
            </div>
          )}
          <textarea
            className="w-full bg-navy-950 text-slate-100 border border-navy-800 rounded-2xl p-6 text-base outline-none transition-all resize-none min-h-[180px] flex-1"
            placeholder="Describe the nature of your conflict..."
            value={text}
            onPaste={handleContextPaste}
            onChange={(e) => {
              const next = e.target.value;
              if (next.length <= CONTEXT_LIMIT_CHARS) {
                setText(next);
                setContextNotice(null);
                return;
              }
              setText(next.slice(0, CONTEXT_LIMIT_CHARS));
              setContextNotice("Input is limited to 40,000 characters.");
            }}
          />
        </div>
        <div className="rounded-2xl border border-navy-800 bg-navy-900/60 p-4 md:p-6 space-y-4">
          <h2 className="flex flex-wrap items-baseline gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest case-step-label">
              02 Choose Your Package
            </span>
            <span className="text-sm text-slate-300">
              Select which session credits to use for this analysis.
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3" role="radiogroup" aria-label="Package selection">
            <label
              className={`flex flex-col gap-3 rounded-xl border px-4 py-4 transition-all ${
                selectedPackage === "standard"
                  ? "border-blue-500/70 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]"
                  : "border-navy-800 bg-navy-950/30 hover:border-navy-700"
              } ${standardUnavailable ? "opacity-80" : ""} cursor-pointer`}
              title="Standard Package: faster, economical analysis powered by Claude Haiku."
            >
              <input
                type="radio"
                name="package"
                className="sr-only"
                checked={selectedPackage === "standard"}
                onChange={() => setSelectedPackage("standard")}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center border ${
                      selectedPackage === "standard"
                        ? "border-blue-400 bg-blue-500/20 text-blue-300"
                        : "border-navy-700 bg-navy-900 text-slate-400"
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">Standard Package</div>
                    <div className="text-[10px] text-blue-300 uppercase tracking-widest">Claude Haiku</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  {showStandardRecommendation && (
                    <span className="text-[9px] uppercase tracking-widest font-bold text-blue-300 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded">
                      Recommended
                    </span>
                  )}
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">Sessions left</div>
                  <div className="text-lg font-bold text-slate-100">{standardSessions}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Faster, economical insights for everyday disputes.</span>
                {standardUnavailable && (
                  <span className="text-[10px] uppercase tracking-widest text-rose-300">No credits</span>
                )}
              </div>
            </label>
            <label
              className={`flex flex-col gap-3 rounded-xl border px-4 py-4 transition-all ${
                selectedPackage === "premium"
                  ? "border-blue-500/70 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]"
                  : "border-navy-800 bg-navy-950/30 hover:border-navy-700"
              } ${premiumUnavailable ? "opacity-80" : ""} cursor-pointer`}
              title="Premium Package: deeper, higher-quality analysis powered by Claude Sonnet."
            >
              <input
                type="radio"
                name="package"
                className="sr-only"
                checked={selectedPackage === "premium"}
                onChange={() => setSelectedPackage("premium")}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center border ${
                      selectedPackage === "premium"
                        ? "border-gold-400 bg-gold-500/20 text-gold-300"
                        : "border-navy-700 bg-navy-900 text-slate-400"
                    }`}
                  >
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">Premium Package</div>
                    <div className="text-[10px] text-gold-300 uppercase tracking-widest">Claude Sonnet</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  {showPremiumRecommendation && (
                    <span className="text-[9px] uppercase tracking-widest font-bold text-gold-300 bg-gold-500/10 border border-gold-500/30 px-2 py-0.5 rounded">
                      Recommended
                    </span>
                  )}
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">Sessions left</div>
                  <div className="text-lg font-bold text-slate-100">{premiumSessions}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Advanced reasoning for high-stakes conflicts.</span>
                {premiumUnavailable && (
                  <span className="text-[10px] uppercase tracking-widest text-rose-300">No credits</span>
                )}
              </div>
            </label>
          </div>
          {showPackageNotice && selectedSessions <= 0 && (
            <div className="text-xs text-rose-100 border border-rose-400/70 bg-rose-500/20 rounded-xl px-3 py-2 flex flex-wrap items-center gap-2">
              <span>
                No session credits available for{" "}
                {selectedPackage === "standard" ? "Standard" : "Premium"} package.
              </span>
              <span className="font-semibold">Click here to</span>
              <button
                type="button"
                onClick={() => router.push("/unlock/credits")}
                className="text-white underline underline-offset-4 font-semibold"
              >
                {purchaseLabel}
              </button>
              <span>to begin.</span>
            </div>
          )}
        </div>
        <div className="pt-2">
          <button
            onClick={handleAnalyzeStart}
            disabled={isAnalyzeDisabled}
            className="w-full bg-navy-800 hover:bg-navy-700 text-slate-100 font-medium text-lg py-5 rounded-xl border border-navy-700 shadow-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          >
            <span className="font-serif italic text-gold-400">Start Analysis</span>
            {isStartingAnalysis ? (
              <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5 text-slate-300" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
