import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cleanEnvValue } from "@/lib/server/env";
import { requireAiAuth } from "@/lib/server/ai-auth";

export const runtime = "nodejs";

const supabaseUrl = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceRoleKey = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: { message, upstreamStatus: status } }, { status });

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

const createTotals = (): Totals => ({ added: 0, used: 0, net: 0 });

const applyDelta = (totals: Totals, delta: number) => {
  if (delta > 0) {
    totals.added += delta;
  } else if (delta < 0) {
    totals.used += Math.abs(delta);
  }
  totals.net += delta;
};

export async function GET(request: Request) {
  const authGuard = await requireAiAuth(request);
  if (authGuard.ok === false) return authGuard.error;
  if (!authGuard.userId) return errorResponse("Unauthorized", 401);
  if (!supabaseAdmin) return errorResponse("Server configuration error", 500);

  const { data, error } = await supabaseAdmin
    .from("session_events")
    .select("id, plan_type, delta, reason, created_at, case_id, round_id")
    .eq("user_id", authGuard.userId)
    .order("created_at", { ascending: false });

  if (error) {
    return errorResponse("Session ledger unavailable", 500);
  }

  const monthMap = new Map<string, MonthlySummary & { dayMap: Map<string, DailySummary> }>();

  (data || []).forEach((row) => {
    const createdAt = typeof row.created_at === "string" ? row.created_at : new Date().toISOString();
    const dayKey = createdAt.slice(0, 10);
    const monthKey = dayKey.slice(0, 7);
    const planType = row.plan_type === "premium" ? "premium" : "standard";
    const delta = Number(row.delta) || 0;

    let monthEntry = monthMap.get(monthKey);
    if (!monthEntry) {
      monthEntry = {
        month: monthKey,
        standard: createTotals(),
        premium: createTotals(),
        total: createTotals(),
        days: [],
        dayMap: new Map(),
      };
      monthMap.set(monthKey, monthEntry);
    }

    let dayEntry = monthEntry.dayMap.get(dayKey);
    if (!dayEntry) {
      dayEntry = {
        date: dayKey,
        standard: createTotals(),
        premium: createTotals(),
        total: createTotals(),
        events: [],
      };
      monthEntry.dayMap.set(dayKey, dayEntry);
    }

    const event: LedgerEvent = {
      id: row.id,
      planType,
      delta,
      reason: row.reason ?? null,
      createdAt,
      caseId: row.case_id ?? null,
      roundId: row.round_id ?? null,
    };
    dayEntry.events.push(event);

    applyDelta(monthEntry.total, delta);
    applyDelta(monthEntry[planType], delta);
    applyDelta(dayEntry.total, delta);
    applyDelta(dayEntry[planType], delta);
  });

  const months: MonthlySummary[] = Array.from(monthMap.values()).map((monthEntry) => {
    const days = Array.from(monthEntry.dayMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    return {
      month: monthEntry.month,
      standard: monthEntry.standard,
      premium: monthEntry.premium,
      total: monthEntry.total,
      days,
    };
  });

  months.sort((a, b) => b.month.localeCompare(a.month));

  return NextResponse.json({ data: { months } });
}
