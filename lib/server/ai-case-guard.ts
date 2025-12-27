import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { PlanType } from "@/types";

type CaseAccessResult =
  | { ok: true; caseRow: any }
  | { ok: false; error: NextResponse };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: { message, upstreamStatus: status } }, { status });

const caseAccessRequired = () => process.env.ENFORCE_AI_CASE_ACCESS === "true";

const normalizePlan = (planType?: PlanType | string) => (planType === "premium" ? "premium" : "standard");

export const requireCaseAccess = async ({
  caseId,
  userId,
  planType,
  requireOpen,
}: {
  caseId?: string | null;
  userId?: string | null;
  planType?: PlanType | string;
  requireOpen?: boolean;
}): Promise<CaseAccessResult> => {
  if (!caseAccessRequired()) {
    return { ok: true, caseRow: null };
  }
  if (!supabaseAdmin) {
    return { ok: false, error: errorResponse("Server configuration error", 500) };
  }
  if (!userId) {
    return { ok: false, error: errorResponse("Unauthorized", 401) };
  }
  if (!caseId) {
    return { ok: false, error: errorResponse("Missing caseId", 400) };
  }

  const { data, error } = await supabaseAdmin
    .from("cases")
    .select("id, user_id, plan_type, is_closed, rounds_used, rounds_limit")
    .eq("id", caseId)
    .single();
  if (error || !data) {
    return { ok: false, error: errorResponse("Case not found", 404) };
  }
  if (data.user_id !== userId) {
    return { ok: false, error: errorResponse("Forbidden", 403) };
  }
  const normalizedPlan = normalizePlan(planType);
  if (planType && data.plan_type !== normalizedPlan) {
    return { ok: false, error: errorResponse("Plan type mismatch", 403) };
  }
  if (requireOpen) {
    const roundsLimit = Number(data.rounds_limit);
    const roundsUsed = Number(data.rounds_used);
    if (data.is_closed || (Number.isFinite(roundsLimit) && Number.isFinite(roundsUsed) && roundsUsed >= roundsLimit)) {
      return { ok: false, error: errorResponse("Case limit reached", 403) };
    }
  }

  return { ok: true, caseRow: data };
};

