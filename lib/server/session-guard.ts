import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cleanEnvValue } from "@/lib/server/env";

type SessionGuardResult =
  | { ok: true; consumed: boolean; remaining: number }
  | { ok: false; error: NextResponse };

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

const normalizePlan = (planType?: string) => (planType === "premium" ? "premium" : "standard");

export const consumeSession = async ({
  userId,
  planType,
  caseId,
  roundId,
  reason,
}: {
  userId?: string | null;
  planType?: string;
  caseId?: string | null;
  roundId?: string | null;
  reason?: string | null;
}): Promise<SessionGuardResult> => {
  if (!supabaseAdmin) {
    return { ok: false, error: errorResponse("Server configuration error", 500) };
  }
  if (!userId) {
    return { ok: false, error: errorResponse("Unauthorized", 401) };
  }
  const plan = normalizePlan(planType);
  if (!planType || (plan !== "standard" && plan !== "premium")) {
    return { ok: false, error: errorResponse("Missing plan type", 400) };
  }

  const { data, error } = await supabaseAdmin.rpc("consume_session", {
    p_user_id: userId,
    p_plan_type: plan,
    p_case_id: caseId,
    p_round_id: roundId,
    p_reason: reason,
  });

  if (error || !data) {
    return { ok: false, error: errorResponse("Session ledger unavailable", 500) };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const consumed = row?.consumed === true;
  const remaining = Number(row?.remaining) || 0;

  if (!consumed) {
    return { ok: false, error: errorResponse("No sessions remaining", 402) };
  }

  return { ok: true, consumed, remaining };
};

export const refundSession = async ({
  userId,
  planType,
  caseId,
  roundId,
  reason,
}: {
  userId?: string | null;
  planType?: string;
  caseId?: string | null;
  roundId?: string | null;
  reason?: string | null;
}): Promise<void> => {
  if (!supabaseAdmin || !userId) return;
  const plan = normalizePlan(planType);
  await supabaseAdmin.rpc("refund_session", {
    p_user_id: userId,
    p_plan_type: plan,
    p_case_id: caseId,
    p_round_id: roundId,
    p_reason: reason,
  });
};
