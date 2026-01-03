"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/UI";
import { Toaster } from "@/components/DesignSystem";
import { authService } from "@/services/auth";
import { store } from "@/services/store";
import { themeService } from "@/services/theme";
import { Theme } from "@/types";
import {
  Archive,
  Book,
  BookOpen,
  CheckCircle2,
  FileText,
  HelpCircle,
  Home as HomeIcon,
  CreditCard,
  LogIn,
  LogOut,
  Loader2,
  MessageSquareQuote,
  Monitor,
  Moon,
  MoonStar,
  Settings,
  Sun,
  Feather,
  Disc,
  Gem,
  Snowflake,
  X,
  XCircle,
  Zap,
} from "lucide-react";

const MARKET_LEADER_PROVIDERS = [
  { key: "openai", label: "OpenAI", prefix: "openai/" },
  { key: "anthropic", label: "Anthropic", prefix: "anthropic/" },
  { key: "google", label: "Google", prefix: "google/" },
  { key: "xai", label: "xAI", prefix: "x-ai/" },
  { key: "deepseek", label: "DeepSeek", prefix: "deepseek/" },
  { key: "meta", label: "Meta", prefix: "meta-llama/" },
  { key: "mistral", label: "Mistral", prefix: "mistralai/" },
];

type OpenRouterModel = {
  id: string;
  name?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  architecture?: {
    modality?: string;
  };
};

type PlanKey = "standard" | "premium";

type ProviderGroup = {
  key: string;
  label: string;
  prefix: string;
  models: OpenRouterModel[];
};

const formatPrice = (value?: string) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return "n/a";
  const perMillion = num * 1000000;
  const decimals = perMillion < 1 ? 4 : 2;
  return `$${perMillion.toFixed(decimals)}/1M`;
};

const formatContext = (value?: number) =>
  Number.isFinite(value) && value ? value.toLocaleString() : "n/a";

const safeParseJson = (text: string) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const parseOpenRouterModelsPayload = (payload: any): OpenRouterModel[] => {
  const data = Array.isArray(payload?.data) ? payload.data : [];
  return data.filter((model) => model && typeof model.id === "string");
};

const loadOpenRouterModels = async (): Promise<OpenRouterModel[]> => {
  const response = await fetch("/api/models");
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Request failed with ${response.status}`);
  }
  const payload = safeParseJson(text);
  return parseOpenRouterModelsPayload(payload);
};

const buildProviderGroups = (models: OpenRouterModel[]): ProviderGroup[] =>
  MARKET_LEADER_PROVIDERS.map((provider) => {
    const providerModels = models
      .filter((model) => model?.id?.startsWith(provider.prefix))
      .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
    return { ...provider, models: providerModels };
  });

const ensureCurrentModelGroup = (groups: ProviderGroup[], currentModel: string) => {
  if (!currentModel) return groups;
  const hasCurrent = groups.some((group) => group.models.some((model) => model.id === currentModel));
  if (hasCurrent) return groups;
  return [
    {
      key: "current",
      label: "Current",
      prefix: "",
      models: [{ id: currentModel, name: `${currentModel} (current)` }],
    },
    ...groups,
  ];
};

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const session = await authService.getSession();
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const ModelListModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadModels = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await loadOpenRouterModels();
        if (isMounted) setModels(data);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load models");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadModels();
    return () => {
      isMounted = false;
    };
  }, []);

  const providers = buildProviderGroups(models);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-navy-900 border border-navy-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-navy-800">
          <h3 className="font-serif font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-gold-500" /> OpenRouter Models
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-400">
            Source: /api/models. Filtered to market leaders: OpenAI, Anthropic, Google, xAI, DeepSeek,
            Meta, Mistral.
          </p>
          {loading ? (
            <div className="text-sm text-slate-400">Loading model list...</div>
          ) : error ? (
            <div className="text-sm text-rose-400">{error}</div>
          ) : (
            <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">
              {providers.map((provider) => (
                <div key={provider.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      {provider.label}
                    </span>
                    <span className="text-[10px] text-slate-500">{provider.models.length} models</span>
                  </div>
                  {provider.models.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {provider.models.map((model) => (
                        <div
                          key={model.id}
                          className="bg-navy-950/60 border border-navy-800 rounded-xl p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-100">
                                {model.name || model.id}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono break-all">
                                {model.id}
                              </div>
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-slate-500">
                              {model.architecture?.modality || "text"}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                            <div>
                              <span className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                                Context
                              </span>
                              <div className="text-slate-300">{formatContext(model.context_length)}</div>
                            </div>
                            <div>
                              <span className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                                Pricing
                              </span>
                              <div className="text-slate-300">
                                P {formatPrice(model.pricing?.prompt)} / C {formatPrice(model.pricing?.completion)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">No models found.</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-navy-800 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themeService.get());
  const [isAdmin, setIsAdmin] = useState(false);
  const [standardSessions, setStandardSessions] = useState(0);
  const [premiumSessions, setPremiumSessions] = useState(0);
  const [showModelList, setShowModelList] = useState(false);
  const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>([]);
  const [modelSelections, setModelSelections] = useState<Record<PlanKey, string>>({
    standard: "",
    premium: "",
  });
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [modelsSaving, setModelsSaving] = useState<PlanKey | null>(null);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setCurrentTheme(themeService.get());
      const account = await store.getAccount();
      if (!isMounted) return;
      setIsAdmin(account.isAdmin);
      setStandardSessions(account.standardSessions || 0);
      setPremiumSessions(account.premiumSessions || 0);
      if (!account.isAdmin) return;

      setModelsLoading(true);
      setModelsError(null);
      try {
        const modelList = await loadOpenRouterModels();
        if (isMounted) setAvailableModels(modelList);
        const authHeaders = await getAuthHeaders();
        const response = await fetch("/api/admin/models", { headers: authHeaders });
        const text = await response.text();
        if (!response.ok) {
          throw new Error(text || `Request failed with ${response.status}`);
        }
        const payload = safeParseJson(text);
        const standardModel = payload?.data?.standard?.modelSlug || "";
        const premiumModel = payload?.data?.premium?.modelSlug || "";
        if (isMounted) {
          setModelSelections({ standard: standardModel, premium: premiumModel });
        }
      } catch (err) {
        if (isMounted) {
          setModelsError(err instanceof Error ? err.message : "Failed to load model settings");
        }
      } finally {
        if (isMounted) setModelsLoading(false);
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleThemeChange = (theme: Theme) => {
    themeService.set(theme);
    setCurrentTheme(theme);
    store.updateUserTheme(theme);
  };

  const providerGroups = useMemo(() => buildProviderGroups(availableModels), [availableModels]);
  const standardGroups = useMemo(
    () => ensureCurrentModelGroup(providerGroups, modelSelections.standard),
    [providerGroups, modelSelections.standard]
  );
  const premiumGroups = useMemo(
    () => ensureCurrentModelGroup(providerGroups, modelSelections.premium),
    [providerGroups, modelSelections.premium]
  );

  const handleModelChange = async (planType: PlanKey, modelSlug: string) => {
    if (!modelSlug || modelSlug === modelSelections[planType]) return;
    setModelsSaving(planType);
    setModelsError(null);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/admin/models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ planType, modelSlug }),
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || `Request failed with ${response.status}`);
      }
      const payload = safeParseJson(text);
      const updatedSlug = payload?.data?.modelSlug || modelSlug;
      setModelSelections((prev) => ({ ...prev, [planType]: updatedSlug }));
    } catch (err) {
      setModelsError(err instanceof Error ? err.message : "Failed to update model");
    } finally {
      setModelsSaving(null);
    }
  };

  const allThemes = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Navy", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
    { id: "aura", label: "Aura", icon: Feather },
    { id: "midnight", label: "Midnight", icon: MoonStar },
    { id: "slate", label: "Slate", icon: Disc },
    { id: "sapphire", label: "Sapphire", icon: Gem },
    { id: "nordic", label: "Nordic", icon: Snowflake },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-navy-900 border border-navy-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-navy-800">
          <h3 className="font-serif font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-gold-500" /> Settings
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Mediation Sessions
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-navy-950/60 border border-navy-800 rounded-xl px-3 py-3">
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  Standard
                </div>
                <div className="text-xl font-bold text-slate-100">{standardSessions}</div>
              </div>
              <div className="bg-navy-950/60 border border-navy-800 rounded-xl px-3 py-3">
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  Premium
                </div>
                <div className="text-xl font-bold text-slate-100">{premiumSessions}</div>
              </div>
            </div>
            <p
              className="text-[11px] text-slate-500"
              title="1 Session generates strategy + mediation-style guidance + draft responses for one round."
            >
              1 Session generates strategy + mediation-style guidance + draft responses for one round.
            </p>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Appearance
            </label>
            <div className="grid grid-cols-4 gap-3">
              {allThemes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id as Theme)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                    currentTheme === t.id
                      ? "bg-select-active border-gold-500 text-gold-500 shadow-md"
                      : "bg-select-inactive border-navy-800 text-slate-400 hover:border-navy-700"
                  }`}
                >
                  <t.icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold capitalize truncate w-full text-center">
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {isAdmin && (
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                OpenRouter Models
              </label>
              {modelsLoading ? (
                <div className="text-xs text-slate-400">Loading model settings...</div>
              ) : (
                <div className="space-y-4">
                  {modelsError && <div className="text-xs text-rose-400">{modelsError}</div>}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      Standard
                    </label>
                    <select
                      value={modelSelections.standard}
                      onChange={(event) => handleModelChange("standard", event.target.value)}
                      disabled={modelsSaving === "standard"}
                      className="w-full bg-navy-950 border border-navy-800 hover:border-navy-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all disabled:opacity-60"
                    >
                      <option value="" disabled>
                        Select a model...
                      </option>
                      {standardGroups.map((group) =>
                        group.models.length ? (
                          <optgroup key={group.key} label={group.label}>
                            {group.models.map((model) => (
                              <option key={model.id} value={model.id}>
                                {model.name || model.id}
                              </option>
                            ))}
                          </optgroup>
                        ) : null
                      )}
                    </select>
                    {modelsSaving === "standard" && (
                      <div className="text-[11px] text-slate-500">Saving standard model...</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      Premium
                    </label>
                    <select
                      value={modelSelections.premium}
                      onChange={(event) => handleModelChange("premium", event.target.value)}
                      disabled={modelsSaving === "premium"}
                      className="w-full bg-navy-950 border border-navy-800 hover:border-navy-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all disabled:opacity-60"
                    >
                      <option value="" disabled>
                        Select a model...
                      </option>
                      {premiumGroups.map((group) =>
                        group.models.length ? (
                          <optgroup key={group.key} label={group.label}>
                            {group.models.map((model) => (
                              <option key={model.id} value={model.id}>
                                {model.name || model.id}
                              </option>
                            ))}
                          </optgroup>
                        ) : null
                      )}
                    </select>
                    {modelsSaving === "premium" && (
                      <div className="text-[11px] text-slate-500">Saving premium model...</div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Auto-filtered from /api/models for OpenAI, Anthropic, Google, xAI, DeepSeek, Meta, and Mistral.
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Admin Tools
            </label>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => isAdmin && setShowModelList(true)}
                disabled={!isAdmin}
                className={`flex-1 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all ${
                  isAdmin
                    ? "bg-navy-900 border-navy-700 text-slate-100 hover:border-gold-500/50"
                    : "bg-navy-950 border-navy-900 text-slate-500 opacity-50 cursor-not-allowed"
                }`}
                aria-disabled={!isAdmin}
              >
                <span className="text-sm font-semibold">Open Router Models</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
                  {isAdmin ? "Manage" : "Admin only"}
                </span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Curated list of market leaders for quick reference and testing.
            </p>
          </div>
          <div className="pt-2">
            <Button fullWidth onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
      {showModelList && <ModelListModal onClose={() => setShowModelList(false)} />}
    </div>
  );
};

const LayoutShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [premiumSessions, setPremiumSessions] = useState(0);
  const [standardSessions, setStandardSessions] = useState(0);
  const [internetOk, setInternetOk] = useState(true);
  const [databaseOk, setDatabaseOk] = useState<boolean | null>(null);
  const [aiOk, setAiOk] = useState<boolean | null>(null);

  useEffect(() => {
    themeService.init();
    const loadAccount = async (nextSession: any) => {
      if (!nextSession) {
        setPremiumSessions(0);
        setStandardSessions(0);
        return;
      }
      const acc = await store.getAccount();
      setPremiumSessions(acc.premiumSessions);
      setStandardSessions(acc.standardSessions);
      if (acc.theme) themeService.set(acc.theme);
    };

    authService
      .getSession()
      .then((nextSession) => {
        setSession(nextSession);
        loadAccount(nextSession);
        setAuthReady(true);
      })
      .catch(() => {
        setAuthReady(true);
      });
    const {
      data: { subscription },
    } = authService.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      loadAccount(nextSession);
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, [pathname]);

  useEffect(() => {
    const updateOnline = () => setInternetOk(navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      if (!internetOk) {
        if (isMounted) {
          setDatabaseOk(false);
          setAiOk(false);
        }
        return;
      }
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        const payload = await response.json().catch(() => null);
        if (!isMounted) return;
        if (!response.ok || !payload?.data) {
          setDatabaseOk(false);
          setAiOk(false);
          return;
        }
        setDatabaseOk(Boolean(payload.data.database));
        setAiOk(Boolean(payload.data.ai));
      } catch {
        if (isMounted) {
          setDatabaseOk(false);
          setAiOk(false);
        }
      }
    };

    checkHealth();
    return () => {
      isMounted = false;
    };
  }, [internetOk]);

  const navItems = [
    { icon: HomeIcon, label: "Start", path: "/" },
    { icon: BookOpen, label: "Resolution Library", path: "/resources" },
    { icon: CreditCard, label: "Purchase sessions", path: "/unlock/credits", showOnMobile: false },
    { icon: FileText, label: "Billing Ledger", path: "/ledger", showOnMobile: false },
    { icon: Archive, label: "Vault", path: "/vault" },
    { icon: Book, label: "Templates", path: "/templates" },
    { icon: MessageSquareQuote, label: "Success Stories", path: "/testimonials" },
    { icon: Settings, label: "Settings", action: () => setShowSettings(true) },
    { icon: HelpCircle, label: "Help Center", path: "/help" },
  ];

  const baseMobileItems = navItems.filter(
    (item) => item.path && item.showOnMobile !== false && item.label !== "Settings"
  );
  const mobileNavItems: Array<{
    key: string;
    label: string;
    icon: React.ElementType;
    path?: string;
    requiresAuth?: boolean;
    disabled?: boolean;
  }> = [];

  if (!authReady) {
    mobileNavItems.push({
      key: "auth-check",
      label: "Checking",
      icon: Loader2,
      disabled: true,
    });
  } else if (!session) {
    mobileNavItems.push({
      key: "auth",
      label: "Sign In",
      icon: LogIn,
      path: "/auth",
    });
  }

  mobileNavItems.push({
    key: "demo",
    label: "Demo",
    icon: Zap,
    path: "/demo",
  });

  baseMobileItems.forEach((item) => {
    mobileNavItems.push({
      key: item.path || item.label,
      label: item.label,
      icon: item.icon,
      path: item.path,
      requiresAuth: item.path === "/vault" || item.path === "/ledger",
    });
  });

  const trackMobileNavClick = (label: string, destination?: string) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("mobile_nav_click", {
        detail: { destination: destination || "action", label },
      })
    );
  };

  const handleSignOut = async () => {
    await authService.signOut();
    router.push("/auth");
  };

  const renderStatusIcon = (ok: boolean | null) => {
    if (ok === null) {
      return <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />;
    }
    return ok ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    ) : (
      <XCircle className="w-4 h-4 text-rose-400" />
    );
  };

  return (
    <div className="flex h-screen bg-navy-950 text-slate-200 overflow-hidden font-sans transition-colors duration-300">
      <Toaster />
      <aside className="hidden md:flex w-64 flex-col border-r border-navy-800 bg-navy-950 transition-colors duration-300">
        <div className="h-16 flex items-center px-6 border-b border-navy-800/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gold-500 rounded-md flex items-center justify-center">
              <span className="font-serif font-bold text-navy-950 text-xs">CR</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-100">Conflict Resolution</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
          <div className="space-y-1">
            {session ? (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:text-slate-100 hover:bg-navy-900"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={() => router.push("/auth")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-navy-800 text-white hover:bg-navy-700"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Join</span>
              </button>
            )}
            {!session && (
              <div className="guest-pill px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-200 border border-amber-500/30">
                Guest mode: demos only. Sign in to unlock Vault + Ledger.
              </div>
            )}
            <button
              onClick={() => router.push("/demo")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-blue-400 hover:bg-blue-500/10 transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>Try Demo Mode</span>
            </button>
          </div>
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Menu</div>
            {navItems.map((item) => {
              if (item.action) {
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:text-slate-100 hover:bg-navy-900"
                  >
                    <item.icon className="w-4 h-4 text-slate-500" />
                    <span>{item.label}</span>
                  </button>
                );
              }
              const requiresAuth = item.path === "/vault" || item.path === "/ledger";
              const isDisabled = requiresAuth && !session;
              const isActive = !isDisabled && pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    if (!item.path || isDisabled) return;
                    router.push(item.path);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDisabled
                      ? "text-slate-600 cursor-not-allowed"
                      : isActive
                        ? "bg-navy-800 text-gold-400"
                        : "text-slate-400 hover:text-slate-100 hover:bg-navy-900"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isDisabled ? "text-slate-600" : isActive ? "text-gold-500" : "text-slate-500"
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <div className="px-3">
            <div className="w-full flex flex-col gap-2 p-2.5 rounded-lg border border-navy-800 bg-navy-900">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                App Health
              </div>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Internet connection</span>
                  {renderStatusIcon(internetOk)}
                </div>
                <div className="flex items-center justify-between">
                  <span>Database connection</span>
                  {renderStatusIcon(databaseOk)}
                </div>
                <div className="flex items-center justify-between">
                  <span>AI API connection</span>
                  {renderStatusIcon(aiOk)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden scroll-smooth transition-colors duration-300 bg-navy-950">
        {children}
      </main>
      <nav className="md:hidden fixed bottom-0 w-full bg-navy-950/90 backdrop-blur-lg border-t border-navy-800 pb-safe-area z-50 transition-colors duration-300">
        <div className="flex items-center h-16 px-2 gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-navy-700/70">
          {mobileNavItems.map((item) => {
            const isDisabled = Boolean(item.disabled || (item.requiresAuth && !session));
            const isActive = !isDisabled && item.path && pathname === item.path;
            const Icon = item.icon;
            const title = isDisabled ? "Sign in to access" : item.label;
            return (
              <button
                key={item.key}
                onClick={() => {
                  if (isDisabled) return;
                  trackMobileNavClick(item.label, item.path);
                  if (!item.path) return;
                  router.push(item.path);
                }}
                aria-disabled={isDisabled}
                title={title}
                className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors shrink-0 ${
                  isDisabled
                    ? "text-slate-600 cursor-not-allowed"
                    : isActive
                      ? "text-gold-500"
                      : item.key === "auth"
                        ? "text-white"
                        : "text-slate-500"
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${
                    isActive ? "scale-110 transition-transform" : ""
                  } ${item.key === "auth-check" ? "animate-spin" : ""}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[9px] font-medium leading-tight text-center whitespace-normal">
                  {item.label}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => {
              trackMobileNavClick("Settings");
              setShowSettings(true);
            }}
            className="flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors text-slate-500 shrink-0"
            title="Settings"
          >
            <Settings className="w-6 h-6" strokeWidth={2} />
            <span className="text-[9px] font-medium leading-tight text-center whitespace-normal">Settings</span>
          </button>
        </div>
      </nav>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default LayoutShell;

