"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";

type Totals = { added: number; used: number; net: number };
type LedgerEvent = {
  id: string;
  planType: "standard" | "premium";
  delta: number;
  reason: string | null;
  createdAt: string;
  caseId: string | null;
  roundId: string | null;
};
type DailySummary = {
  date: string;
  standard: Totals;
  premium: Totals;
  total: Totals;
  events: LedgerEvent[];
};
type MonthlySummary = {
  month: string;
  standard: Totals;
  premium: Totals;
  total: Totals;
  days: DailySummary[];
};

const formatMonth = (monthKey: string) => {
  const date = new Date(`${monthKey}-01T00:00:00Z`);
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
};

const formatDate = (dayKey: string) => {
  const date = new Date(`${dayKey}T00:00:00Z`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatDelta = (delta: number) => (delta > 0 ? `+${delta}` : `${delta}`);

export const Ledger: React.FC = () => {
  const router = useRouter();
  const [months, setMonths] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMonth, setActiveMonth] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadLedger = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/ledger", { cache: "no-store" });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.data) {
          throw new Error(payload?.error?.message || "Unable to load session ledger.");
        }
        if (!isMounted) return;
        const monthData = Array.isArray(payload.data.months) ? payload.data.months : [];
        setMonths(monthData);
        setActiveMonth(monthData[0]?.month || null);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Unable to load session ledger.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadLedger();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeSummary = useMemo(
    () => months.find((month) => month.month === activeMonth) || null,
    [months, activeMonth]
  );

  return (
    <div className="min-h-screen bg-navy-950 px-6 md:px-10 py-10 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-serif font-bold text-slate-100">Session Ledger</h1>
            <p className="text-sm text-slate-400">
              Monthly rollups of session purchases and usage with daily drill downs.
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading session ledger...
          </div>
        ) : error ? (
          <div className="text-sm text-rose-200 border border-rose-500/40 bg-rose-500/10 rounded-xl px-4 py-3">
            {error}
          </div>
        ) : months.length === 0 ? (
          <div className="text-sm text-slate-400 border border-navy-800 bg-navy-900/40 rounded-xl px-4 py-6">
            No session activity yet.
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {months.map((month) => (
                <button
                  key={month.month}
                  type="button"
                  onClick={() => setActiveMonth(month.month)}
                  className={`text-left rounded-2xl border px-5 py-4 transition-all ${
                    activeMonth === month.month
                      ? "border-blue-500/70 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]"
                      : "border-navy-800 bg-navy-900/50 hover:border-navy-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-semibold text-slate-100">{formatMonth(month.month)}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      Net {formatDelta(month.total.net)}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg border border-navy-800 bg-navy-950/50 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-widest text-slate-500">Standard</div>
                      <div className="text-slate-200">
                        +{month.standard.added} / -{month.standard.used}
                      </div>
                    </div>
                    <div className="rounded-lg border border-navy-800 bg-navy-950/50 px-3 py-2">
                      <div className="text-[10px] uppercase tracking-widest text-slate-500">Premium</div>
                      <div className="text-slate-200">
                        +{month.premium.added} / -{month.premium.used}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {activeSummary && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-100">
                    Daily Drill Down - {formatMonth(activeSummary.month)}
                  </h2>
                  <span className="text-xs text-slate-500">
                    Positive = purchases, negative = consumption
                  </span>
                </div>
                <div className="space-y-3">
                  {activeSummary.days.map((day) => (
                    <div
                      key={day.date}
                      className="rounded-2xl border border-navy-800 bg-navy-900/60 px-5 py-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-slate-100">
                          {formatDate(day.date)}
                        </div>
                        <div className="text-xs text-slate-400">
                          Net {formatDelta(day.total.net)}
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
                        <div className="rounded-lg border border-navy-800 bg-navy-950/50 px-3 py-2">
                          <div className="text-[10px] uppercase tracking-widest text-slate-500">Standard</div>
                          <div>
                            +{day.standard.added} / -{day.standard.used}
                          </div>
                        </div>
                        <div className="rounded-lg border border-navy-800 bg-navy-950/50 px-3 py-2">
                          <div className="text-[10px] uppercase tracking-widest text-slate-500">Premium</div>
                          <div>
                            +{day.premium.added} / -{day.premium.used}
                          </div>
                        </div>
                        <div className="rounded-lg border border-navy-800 bg-navy-950/50 px-3 py-2">
                          <div className="text-[10px] uppercase tracking-widest text-slate-500">Total</div>
                          <div>
                            +{day.total.added} / -{day.total.used}
                          </div>
                        </div>
                      </div>
                      {day.events.length > 0 && (
                        <div className="mt-4 space-y-2 text-xs">
                          {day.events.map((event) => (
                            <div
                              key={event.id}
                              className="flex flex-wrap items-center justify-between gap-3 border border-navy-800/60 bg-navy-950/40 rounded-lg px-3 py-2"
                            >
                              <div className="text-slate-300">
                                {event.planType === "premium" ? "Premium" : "Standard"} -{" "}
                                {event.reason || "Session update"}
                              </div>
                              <div
                                className={`font-semibold ${
                                  event.delta >= 0 ? "text-emerald-400" : "text-rose-300"
                                }`}
                              >
                                {formatDelta(event.delta)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Ledger;
