"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { store } from "../services/store";
import { supabase } from "../services/supabase";
import { exportService } from "../services/export";
import {
  LedgerPurchaseRow,
  LedgerUsageRow,
  PurchaseEvent,
  SessionEvent,
  UserAccount,
} from "../types";
import { Badge, Button } from "../components/UI";
import { Skeleton, Tabs, TabsContent, TabsList, TabsTrigger, toast } from "../components/DesignSystem";
import {
  AlertCircle,
  Archive,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Printer,
} from "lucide-react";

type AuthState = "loading" | "signed_out" | "signed_in" | "error";

const formatMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const formatDayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const formatMonthLabel = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

const formatDayLabel = (date: Date) =>
  date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const formatTimeLabel = (value: string) =>
  new Date(value).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

const buildUsageRows = (
  events: SessionEvent[],
  caseMap: Map<string, { title: string; planType: "standard" | "premium" }>,
  roundMap: Map<string, { roundNumber: number; selectedMode?: string; modelSlug?: string }>
): LedgerUsageRow[] => {
  const refundKeys = new Set(
    events
      .filter((event) => event.delta > 0)
      .map((event) => `${event.caseId ?? "none"}|${event.roundId ?? "none"}`)
  );

  return events.map((event) => {
    const key = `${event.caseId ?? "none"}|${event.roundId ?? "none"}`;
    const caseInfo = event.caseId ? caseMap.get(event.caseId) : null;
    const roundInfo = event.roundId ? roundMap.get(event.roundId) : null;
    const isRerun =
      typeof event.reason === "string" && event.reason.toLowerCase().includes("rerun");

    let status: LedgerUsageRow["status"] = "success";
    if (event.delta > 0) {
      status = "refunded";
    } else if (refundKeys.has(key)) {
      status = "failed";
    }

    return {
      id: event.id,
      caseId: event.caseId ?? null,
      roundId: event.roundId ?? null,
      caseTitle: caseInfo?.title || "Unknown Case",
      roundLabel: roundInfo ? `Round ${roundInfo.roundNumber}` : "New round",
      modeLabel: roundInfo?.selectedMode || "Unknown mode",
      modelLabel:
        roundInfo?.modelSlug ||
        (event.planType === "premium" ? "Premium model" : "Standard model"),
      planType: event.planType,
      isRerun,
      status,
      delta: event.delta,
      createdAt: event.createdAt,
    };
  });
};

const buildPurchaseRows = (events: PurchaseEvent[]): LedgerPurchaseRow[] =>
  events.map((event) => ({
    id: event.id,
    planType: event.planType,
    quantity: event.quantity,
    amount: event.amount,
    currency: event.currency,
    provider: event.provider,
    status: event.status,
    externalRef: event.externalRef ?? null,
    createdAt: event.createdAt,
  }));

const groupRowsByMonth = <T extends { createdAt: string }>(rows: T[]) => {
  const monthMap = new Map<
    string,
    {
      monthKey: string;
      label: string;
      days: { dayKey: string; label: string; rows: T[] }[];
    }
  >();

  rows.forEach((row) => {
    const date = new Date(row.createdAt);
    const monthKey = formatMonthKey(date);
    const dayKey = formatDayKey(date);
    const monthLabel = formatMonthLabel(date);
    const dayLabel = formatDayLabel(date);

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { monthKey, label: monthLabel, days: [] });
    }
    const month = monthMap.get(monthKey)!;
    let day = month.days.find((d) => d.dayKey === dayKey);
    if (!day) {
      day = { dayKey, label: dayLabel, rows: [] };
      month.days.push(day);
    }
    day.rows.push(row);
  });

  const monthGroups = Array.from(monthMap.values());
  monthGroups.sort((a, b) => (a.monthKey < b.monthKey ? 1 : -1));
  monthGroups.forEach((group) => {
    group.days.sort((a, b) => (a.dayKey < b.dayKey ? 1 : -1));
  });
  return monthGroups;
};

export const Ledger: React.FC = () => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<UserAccount>({
    premiumSessions: 0,
    standardSessions: 0,
    totalCasesCreated: 0,
    isAdmin: false,
    role: "demo",
  });
  const [usageRows, setUsageRows] = useState<LedgerUsageRow[]>([]);
  const [purchaseRows, setPurchaseRows] = useState<LedgerPurchaseRow[]>([]);
  const [usageExpanded, setUsageExpanded] = useState<Record<string, boolean>>({});
  const [purchaseExpanded, setPurchaseExpanded] = useState<Record<string, boolean>>({});

  const loadLedger = async () => {
    setLoading(true);
    setAuthState("loading");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        setAuthState("error");
        return;
      }
      if (!user) {
        setAuthState("signed_out");
        return;
      }
      setAuthState("signed_in");

      const [accountData, ledgerSnapshot, cases] = await Promise.all([
        store.getAccount(),
        store.getLedgerSnapshot(),
        store.getCases(),
      ]);
      setAccount(accountData);

      const sessionEvents = ledgerSnapshot.sessionEvents;
      const purchaseEvents = ledgerSnapshot.purchaseEvents;

      const caseMap = new Map(
        cases.map((entry) => [entry.id, { title: entry.title, planType: entry.planType }])
      );
      const roundIds = Array.from(
        new Set(sessionEvents.map((event) => event.roundId).filter(Boolean))
      ) as string[];
      const rounds = await store.getRoundsByIds(roundIds);
      const roundMap = new Map(
        rounds.map((round) => [
          round.id,
          { roundNumber: round.roundNumber, selectedMode: round.selectedMode, modelSlug: round.modelSlug },
        ])
      );

      setUsageRows(buildUsageRows(sessionEvents, caseMap, roundMap));
      setPurchaseRows(buildPurchaseRows(purchaseEvents));
    } catch (error) {
      console.error("Ledger load failed:", error);
      setAuthState("error");
      toast("Couldn't load the ledger. Retry.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const usageGroups = useMemo(() => groupRowsByMonth(usageRows), [usageRows]);
  const purchaseGroups = useMemo(() => groupRowsByMonth(purchaseRows), [purchaseRows]);

  useEffect(() => {
    if (usageGroups.length) {
      setUsageExpanded((prev) => ({ ...prev, [usageGroups[0].monthKey]: true }));
    }
    if (purchaseGroups.length) {
      setPurchaseExpanded((prev) => ({ ...prev, [purchaseGroups[0].monthKey]: true }));
    }
  }, [usageGroups.length, purchaseGroups.length]);

  const usageThisMonth = useMemo(() => {
    const now = new Date();
    const currentMonthKey = formatMonthKey(now);
    const monthRows = usageRows.filter(
      (row) => formatMonthKey(new Date(row.createdAt)) === currentMonthKey
    );
    const usedCount = monthRows.filter((row) => row.delta < 0).length;
    const rerunCount = monthRows.filter((row) => row.delta < 0 && row.isRerun).length;
    const refundCount = monthRows.filter((row) => row.delta > 0).length;
    return { usedCount, rerunCount, refundCount };
  }, [usageRows]);

  const handlePrintLedger = () => {
    exportService.printLedgerToPDF({
      generatedAt: new Date().toISOString(),
      accountName: account.name,
      standardBalance: account.standardSessions,
      premiumBalance: account.premiumSessions,
      usageRows,
      purchaseRows,
    });
  };

  const handleViewCaseFile = async (row: LedgerUsageRow) => {
    if (!row.caseId) return;
    toast("Preparing case file...", "info");
    try {
      const [caseInfo, rounds] = await Promise.all([
        store.getCase(row.caseId),
        store.getRounds(row.caseId),
      ]);
      if (!caseInfo) {
        toast("Case not found.", "error");
        return;
      }
      exportService.printToPDF(caseInfo, rounds);
    } catch (error) {
      console.error("Case file load failed:", error);
      toast("Couldn't load case file. Retry.", "error");
    }
  };

  if (authState === "signed_out") {
    return (
      <div className="flex flex-col w-full h-full animate-fade-in pb-20 md:pb-0 px-6 md:px-10">
        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 min-h-[400px] gap-4">
          <Archive className="w-12 h-12 opacity-30" />
          <div className="text-center space-y-2">
            <p className="text-sm font-semibold text-slate-100">Sign in to view your ledger.</p>
            <p className="text-xs text-slate-400">Ledger history is tied to your account.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => router.push("/auth")} className="bg-gold-600 text-navy-950 font-bold">
              Sign In / Join
            </Button>
            <Button variant="ghost" onClick={() => router.push("/demo")} className="text-blue-300">
              Try Demo Mode
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (authState === "error") {
    return (
      <div className="flex flex-col w-full h-full animate-fade-in pb-20 md:pb-0 px-6 md:px-10">
        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 min-h-[400px] gap-4">
          <AlertCircle className="w-12 h-12 text-rose-400" />
          <div className="text-center space-y-2">
            <p className="text-sm font-semibold text-slate-100">Couldn't connect. Retry.</p>
            <p className="text-xs text-slate-400">Check your connection and try again.</p>
          </div>
          <Button onClick={loadLedger} className="bg-navy-900 border border-navy-700 text-slate-200">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full animate-fade-in pb-20 md:pb-0 px-6 md:px-10">
      <div className="pt-10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-100 mb-2">Session Ledger</h1>
          <p className="text-sm text-slate-400">
            1 Session generates strategy + mediation-style guidance + draft responses for one round.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handlePrintLedger} disabled={loading}>
            <Printer className="w-4 h-4 mr-2" /> Print / PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-navy-900/60 border border-navy-800 rounded-2xl p-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Wallet Balance</div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-blue-400 uppercase tracking-wider font-bold">Standard</div>
              <div className="text-2xl font-bold text-slate-100">{account.standardSessions}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gold-400 uppercase tracking-wider font-bold">Premium</div>
              <div className="text-2xl font-bold text-slate-100">{account.premiumSessions}</div>
            </div>
          </div>
        </div>
        <div className="bg-navy-900/60 border border-navy-800 rounded-2xl p-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">This Month</div>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Sessions used</span>
              <span className="font-semibold text-slate-100">{usageThisMonth.usedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Reruns</span>
              <span className="font-semibold text-slate-100">{usageThisMonth.rerunCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Refunds</span>
              <span className="font-semibold text-slate-100">{usageThisMonth.refundCount}</span>
            </div>
          </div>
        </div>
        <div className="bg-navy-900/60 border border-navy-800 rounded-2xl p-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ledger Health</div>
          <div className="mt-3 text-sm text-slate-300 space-y-2">
            <div className="flex items-center justify-between">
              <span>Usage events</span>
              <span className="font-semibold text-slate-100">{usageRows.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Purchases</span>
              <span className="font-semibold text-slate-100">{purchaseRows.length}</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : (
        <Tabs defaultValue="usage" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
          </TabsList>

          <TabsContent value="usage">
            {usageGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-400 min-h-[240px] gap-3">
                <Archive className="w-10 h-10 opacity-30" />
                <div className="text-sm">No usage events yet.</div>
                {account.isAdmin && (
                  <div className="text-xs text-slate-500 text-center max-w-sm">
                    Admin accounts do not consume Sessions. Disable admin to see deductions.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {usageGroups.map((group) => {
                  const monthUsed = group.days
                    .flatMap((day) => day.rows)
                    .filter((row) => (row as LedgerUsageRow).delta < 0).length;
                  const monthRefunds = group.days
                    .flatMap((day) => day.rows)
                    .filter((row) => (row as LedgerUsageRow).delta > 0).length;

                  return (
                    <div key={group.monthKey} className="bg-navy-900 border border-navy-800 rounded-2xl">
                      <button
                        type="button"
                        onClick={() =>
                          setUsageExpanded((prev) => ({
                            ...prev,
                            [group.monthKey]: !prev[group.monthKey],
                          }))
                        }
                        className="w-full px-5 py-4 flex items-center justify-between text-left"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-100">{group.label}</div>
                          <div className="text-xs text-slate-500">
                            {monthUsed} used · {monthRefunds} refunds
                          </div>
                        </div>
                        {usageExpanded[group.monthKey] ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      {usageExpanded[group.monthKey] && (
                        <div className="border-t border-navy-800 px-5 py-4 space-y-4">
                          {group.days.map((day) => (
                            <div key={day.dayKey} className="space-y-3">
                              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                {day.label}
                              </div>
                              {day.rows.map((row) => {
                                const usage = row as LedgerUsageRow;
                                const statusColor: "green" | "red" | "amber" =
                                  usage.status === "success"
                                    ? "green"
                                    : usage.status === "failed"
                                      ? "red"
                                      : "amber";
                                return (
                                  <div
                                    key={usage.id}
                                    className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-navy-950 border border-navy-800 rounded-xl p-4"
                                  >
                                    <div className="space-y-1">
                                      <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-slate-400" />
                                        {usage.caseTitle}
                                      </div>
                                      <div className="text-xs text-slate-400">
                                        {usage.roundLabel} · {usage.modeLabel} · {usage.modelLabel}
                                      </div>
                                      <div className="text-[11px] text-slate-500">
                                        {usage.planType === "premium" ? "Premium" : "Standard"} ·{" "}
                                        {usage.isRerun ? "Redo round" : "New round"} ·{" "}
                                        {formatTimeLabel(usage.createdAt)}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Badge color={statusColor}>{usage.status}</Badge>
                                      <div className="text-xs font-bold text-slate-300">
                                        {usage.delta < 0 ? "-1 Session" : "+1 Session"}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewCaseFile(usage)}
                                        disabled={!usage.caseId}
                                      >
                                        <Eye className="w-3.5 h-3.5 mr-2" /> View case
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="purchases">
            {purchaseGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-400 min-h-[240px] gap-3">
                <Archive className="w-10 h-10 opacity-30" />
                <div className="text-sm">No purchases yet.</div>
                <Button variant="ghost" onClick={() => router.push("/unlock/credits")}>
                  Visit Sessions Store
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {purchaseGroups.map((group) => {
                  const monthRows = group.days.flatMap((day) => day.rows) as LedgerPurchaseRow[];
                  const pending = monthRows.filter((row) => row.status === "pending").length;
                  const confirmed = monthRows.filter((row) => row.status === "confirmed").length;
                  const failed = monthRows.filter((row) => row.status === "failed").length;

                  return (
                    <div key={group.monthKey} className="bg-navy-900 border border-navy-800 rounded-2xl">
                      <button
                        type="button"
                        onClick={() =>
                          setPurchaseExpanded((prev) => ({
                            ...prev,
                            [group.monthKey]: !prev[group.monthKey],
                          }))
                        }
                        className="w-full px-5 py-4 flex items-center justify-between text-left"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-100">{group.label}</div>
                          <div className="text-xs text-slate-500">
                            {confirmed} confirmed · {pending} pending · {failed} failed
                          </div>
                        </div>
                        {purchaseExpanded[group.monthKey] ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      {purchaseExpanded[group.monthKey] && (
                        <div className="border-t border-navy-800 px-5 py-4 space-y-4">
                          {group.days.map((day) => (
                            <div key={day.dayKey} className="space-y-3">
                              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                {day.label}
                              </div>
                              {day.rows.map((row) => {
                                const purchase = row as LedgerPurchaseRow;
                                const statusColor: "green" | "red" | "amber" =
                                  purchase.status === "confirmed"
                                    ? "green"
                                    : purchase.status === "failed"
                                      ? "red"
                                      : "amber";
                                return (
                                  <div
                                    key={purchase.id}
                                    className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-navy-950 border border-navy-800 rounded-xl p-4"
                                  >
                                    <div className="space-y-1">
                                      <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-slate-400" />
                                        {purchase.planType === "premium" ? "Premium Sessions" : "Standard Sessions"}
                                      </div>
                                      <div className="text-xs text-slate-400">
                                        {purchase.quantity} sessions · {purchase.provider}
                                      </div>
                                      <div className="text-[11px] text-slate-500">
                                        {formatTimeLabel(purchase.createdAt)} ·{" "}
                                        {purchase.externalRef || "Reference pending"}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Badge color={statusColor}>{purchase.status}</Badge>
                                      <div className="text-xs font-bold text-slate-300">
                                        {purchase.currency} {purchase.amount.toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
