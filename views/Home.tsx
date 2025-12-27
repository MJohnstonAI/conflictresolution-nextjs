"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge } from "@/components/UI";
import { Combobox } from "@/components/DesignSystem";
import { toast } from "@/components/DesignSystem";
import { store } from "@/services/store";
import { simulatePurchase, BILLING_PRODUCT_IDS } from "@/services/billing";
import { Case, OpponentType, PlanType, UserAccount } from "@/types";
import { formatApiErrorMessage, readApiErrorDetails } from "@/lib/client/api-errors";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  FileText,
  Home as HomeIcon,
  Link as LinkIcon,
  Loader2,
  User,
  Zap,
} from "lucide-react";
import { consumeRouteState } from "@/lib/route-state";

const CONTEXT_LIMIT_CHARS = 40000;

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

const SEO: React.FC<{ title: string }> = ({ title }) => {
  useEffect(() => {
    document.title = `${title} | Conflict Resolution`;
  }, [title]);
  return null;
};


interface CaseSetupModalProps {
  onClose: () => void;
  onConfirm: (tier: PlanType) => void;
  opponent: string;
}

const CaseSetupModal: React.FC<CaseSetupModalProps> = ({ onClose, onConfirm, opponent }) => {
  const [account, setAccount] = useState<UserAccount>({
    premiumCredits: 0,
    standardCredits: 0,
    totalCasesCreated: 0,
    isAdmin: false,
    role: "demo",
  });
  const [loading, setLoading] = useState<string | null>(null);
  const [modelsError, setModelsError] = useState<string | null>(null);

  useEffect(() => {
    store.getAccount().then(setAccount);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const checkModels = async () => {
      try {
        const response = await fetch("/api/models", { signal: controller.signal });
        if (!response.ok) {
          const details = await readApiErrorDetails(response);
          if (!controller.signal.aborted) {
            setModelsError(formatApiErrorMessage(details, response.status));
          }
          return;
        }
        if (!controller.signal.aborted) {
          setModelsError(null);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : "Unable to reach AI provider.";
        setModelsError(formatApiErrorMessage({ message }));
      }
    };

    checkModels();
    return () => controller.abort();
  }, []);

  const handleBuyStandard = async () => {
    setLoading("standard_buy");
    try {
      const result = await simulatePurchase(BILLING_PRODUCT_IDS.STANDARD_CASE_PASS);
      if (result.success) {
        await store.addCredits("standard", 1);
        const success = await store.deductCredit("standard");
        if (success) {
          onConfirm("standard");
        } else {
          alert("Error activating case pass.");
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(null);
  };

  const handleUseStandardCredit = async () => {
    if (account.standardCredits > 0) {
      setLoading("using_standard");
      const success = await store.deductCredit("standard");
      if (success) onConfirm("standard");
      setLoading(null);
    }
  };

  const handleUsePremiumCredit = async () => {
    if (account.premiumCredits > 0) {
      setLoading("using_premium");
      const success = await store.deductCredit("premium");
      if (success) onConfirm("premium");
      setLoading(null);
    }
  };

  const handleBuyPremium = async (productId: string, creditAmount: number) => {
    setLoading(productId);
    try {
      const result = await simulatePurchase(productId as any);
      if (result.success) {
        await store.addCredits("premium", creditAmount);
        const success = await store.deductCredit("premium");
        if (success) {
          onConfirm("premium");
        } else {
          store.getAccount().then(setAccount);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in">
      <button
        onClick={onClose}
        className="absolute top-6 left-1/2 -translate-x-1/2 p-3 bg-navy-900 border border-navy-700 text-slate-400 hover:text-slate-100 rounded-full shadow-xl z-50 flex items-center gap-2 transition-all hover:scale-105 group"
      >
        <HomeIcon className="w-5 h-5 group-hover:text-gold-500" />
        <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">Return Home</span>
      </button>
      <div className="bg-navy-900 border border-navy-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-auto relative mt-8 md:mt-0">
        {modelsError && (
          <div className="px-6 py-4 border-b border-rose-500/20 bg-rose-900/10 text-rose-200 flex items-center gap-3 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{modelsError}</span>
          </div>
        )}
        <div className="flex flex-col md:flex-row flex-1">
          <div className="w-full md:w-[35%] p-6 border-b md:border-b-0 md:border-r border-navy-800 flex flex-col relative bg-navy-900">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <Badge color="blue">Standard</Badge>
                <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Wallet: {account.standardCredits}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-100">Quick Dispute</h3>
              <p className="text-xs text-blue-400 mt-1">For simple arguments</p>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              <li className="text-sm text-slate-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> 10 Rounds Included
              </li>
            </ul>
            {account.standardCredits > 0 ? (
              <Button
                variant="primary"
                className="bg-blue-600 hover:bg-blue-500 border-none text-white w-full"
                onClick={handleUseStandardCredit}
                disabled={!!loading}
              >
                {loading === "using_standard" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" /> Assign Credit
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="primary"
                className="bg-blue-600 hover:bg-blue-500 border-none text-white mt-auto"
                onClick={handleBuyStandard}
                disabled={!!loading}
              >
                {loading === "standard_buy" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buy & Start ($4.99)"}
              </Button>
            )}
          </div>

          <div className="flex-1 p-6 flex flex-col relative bg-gradient-to-br from-navy-900 to-navy-950">
            <div className="mb-4 flex justify-between items-start">
              <div>
                <Badge color="amber">Serious Conflicts</Badge>
                <h3 className="text-xl font-bold text-slate-100 mt-2">Professional</h3>
                <p className="text-xs text-gold-500 mt-1 font-medium">Deep psychological analysis</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 bg-navy-950/50 px-3 py-1 rounded-full border border-gold-500/20">
                  <Briefcase className="w-3 h-3 text-gold-500" />
                  <span className="text-sm font-bold text-slate-100">{account.premiumCredits} Credits</span>
                </div>
              </div>
            </div>
            <div className="mt-auto space-y-3">
              {account.premiumCredits > 0 ? (
                <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4 text-center">
                  <Button
                    fullWidth
                    className="bg-gold-600 hover:bg-gold-500 text-navy-950 font-bold"
                    onClick={handleUsePremiumCredit}
                    disabled={!!loading}
                  >
                    {loading === "using_premium" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4 mr-2" /> Assign Credit
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleBuyPremium(BILLING_PRODUCT_IDS.PREMIUM_CREDIT_1, 1)}
                    disabled={!!loading}
                    className="p-3 rounded-xl border border-navy-700 bg-navy-800 hover:border-slate-500 transition-all"
                  >
                    <div className="text-sm font-bold text-slate-100">$14.99</div>
                    <div className="text-[10px] text-slate-400">1 Case</div>
                  </button>
                  <button
                    onClick={() => handleBuyPremium(BILLING_PRODUCT_IDS.PREMIUM_CREDIT_3, 3)}
                    disabled={!!loading}
                    className="p-3 rounded-xl border border-gold-500 bg-gold-500/10 hover:bg-gold-500/20 transition-all"
                  >
                    <div className="text-sm font-bold text-gold-400">$39.99</div>
                    <div className="text-[10px] text-gold-400">3 Cases</div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const router = useRouter();
  const [text, setText] = useState("");
  const [isSummarizingContext, setIsSummarizingContext] = useState(false);
  const [contextNotice, setContextNotice] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<OpponentType>("Ex-Spouse");
  const [customAdversary, setCustomAdversary] = useState("");
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  const opponentOptions = getSortedOpponentOptions();

  useEffect(() => {
    const state = consumeRouteState<{ templateText?: string; opponentType?: OpponentType }>("/");
    if (state?.templateText) setText(state.templateText);
    if (state?.opponentType) setOpponent(state.opponentType);

    store.getAccount().then((acc) => {
      if (acc.name) setUserName(acc.name);
    });
  }, []);

  const handleAnalyzeStart = () => {
    if (!text.trim()) return;
    setShowPlanModal(true);
  };

  const createCase = async (tier: PlanType) => {
    if (tier === "demo") {
      router.push("/demo");
      return;
    }
    let finalOpponent = opponent;
    if (opponent === "Other" && customAdversary.trim()) finalOpponent = customAdversary.trim();
    const limit = tier === "premium" ? 40 : 10;
    const newCase: Case = {
      id: crypto.randomUUID(),
      title: `${finalOpponent} Conflict Case`,
      opponentType: finalOpponent,
      createdAt: new Date().toISOString(),
      roundsLimit: limit,
      roundsUsed: 0,
      planType: tier,
      isClosed: false,
      note: text.slice(0, CONTEXT_LIMIT_CHARS),
    };
    await store.saveCase(newCase);
    setShowPlanModal(false);
    router.push(`/case/${newCase.id}`);
  };

  const isAnalyzeDisabled =
    isSummarizingContext || !text.trim() || (opponent === "Other" && !customAdversary.trim());

  const summarizeContextToLimit = async (rawText: string) => {
    setIsSummarizingContext(true);
    setContextNotice("Input exceeds limits and will be summarised with Claude Sonnet 4.5.");
    toast("Input exceeds 40,000 characters. Summarizing with Claude Sonnet 4.5…", "info");
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

      <div
        onClick={() => router.push("/demo")}
        className="bg-gradient-to-r from-blue-900/30 to-navy-900 border-b border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)] px-6 py-4 flex items-center justify-center gap-3 text-sm text-blue-100 cursor-pointer group hover:bg-blue-900/40 transition-colors"
      >
        <Zap className="w-5 h-5 text-blue-400 fill-blue-500/20 animate-pulse" />
        <span className="font-bold tracking-wide text-sm md:text-base">New to Conflict Resolution?</span>
        <span className="opacity-90 border-b border-blue-400/30 group-hover:border-blue-400 transition-colors">
          Try the interactive <span className="text-gold-400 font-bold">Demo Mode</span>.
        </span>
      </div>

      <div className="pt-8 pb-6 text-center space-y-3 px-6 md:text-left md:px-10">
        <h1 className="text-3xl tracking-tight text-slate-100 md:text-4xl">
          <span className="font-serif font-bold text-gold-400">Start New Case</span>
        </h1>
        <p className="text-slate-300 text-sm leading-relaxed">Select an adversary and describe the situation to begin.</p>
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto px-5 md:px-10 pb-24 md:pb-10 flex flex-col gap-8">
        <div className="space-y-3">
          <Combobox
            label="01 Select Adversary"
            options={opponentOptions}
            value={opponent}
            onChange={(val: string) => setOpponent(val as OpponentType)}
          />
          {opponent === "Other" && (
            <div className="animate-fade-in mt-2">
              <label className="text-[10px] font-bold text-gold-500 uppercase tracking-widest pl-1">
                Specify Adversary Name
              </label>
              <div className="mt-1.5">
                <input
                  autoFocus
                  type="text"
                  value={customAdversary}
                  onChange={(e) => setCustomAdversary(e.target.value)}
                  placeholder="e.g. Bob"
                  className="w-full bg-navy-900/50 border border-gold-500/50 rounded-lg p-3 text-sm text-slate-200 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 flex flex-col flex-1">
          <div className="flex items-center justify-between gap-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
              02 Describe the Conflict Case
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
          <div className="pt-2">
            <button
              onClick={handleAnalyzeStart}
              disabled={isAnalyzeDisabled}
              className="w-full bg-navy-800 hover:bg-navy-700 text-slate-100 font-medium text-lg py-5 rounded-xl border border-navy-700 shadow-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50"
            >
              <span className="font-serif italic text-gold-400">Start Analysis</span>
              <ArrowRight className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </div>
      </div>
      {showPlanModal && (
        <CaseSetupModal
          onClose={() => setShowPlanModal(false)}
          onConfirm={createCase}
          opponent={opponent === "Other" ? customAdversary : opponent}
        />
      )}
    </div>
  );
};

export default Home;
