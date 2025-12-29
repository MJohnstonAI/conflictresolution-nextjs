import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { PlanType } from "@/types";

type PlanKey = "standard" | "premium";

type SessionGuardResult =
  | { ok: true; consumed: boolean; remaining: number | null }
  | { ok: false; error: NextResponse };

type SessionStore = {
  getProfile: (userId: string) => Promise<{ is_admin?: boolean } | null>;
  consume: (input: {
    userId: string;
    planType: PlanKey;
    caseId: string | null;
    roundId: string | null;
    reason: string | null;
  }) => Promise<{ consumed: boolean; remaining: number | null }>;
  refund: (input: {
    userId: string;
    planType: PlanKey;
    caseId: string | null;
    roundId: string | null;
    reason: string | null;
  }) => Promise<void>;
};

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

const normalizePlan = (planType?: PlanType | string): PlanKey =>
  planType === "premium" ? "premium" : "standard";

export const createSessionGuard = (store: SessionStore | null) => {
  const consumeSession = async ({
    userId,
    planType,
    caseId,
    roundId,
    reason,
  }: {
    userId?: string | null;
    planType?: PlanType | string;
    caseId?: string | null;
    roundId?: string | null;
    reason?: string | null;
  }): Promise<SessionGuardResult> => {
    if (!store) {
      return { ok: false, error: errorResponse("Server configuration error", 500) };
    }
    if (!userId) {
      return { ok: false, error: errorResponse("Unauthorized", 401) };
    }

    const profile = await store.getProfile(userId);
    if (!profile) {
      return { ok: false, error: errorResponse("Profile not found", 404) };
    }

    if (profile.is_admin) {
      return { ok: true, consumed: false, remaining: null };
    }

    const planKey = normalizePlan(planType);
    const result = await store.consume({
      userId,
      planType: planKey,
      caseId: caseId ?? null,
      roundId: roundId ?? null,
      reason: reason ?? null,
    });

    if (!result.consumed) {
      if (result.remaining === null) {
        return { ok: false, error: errorResponse("Session check failed", 500) };
      }
      return {
        ok: false,
        error: errorResponse("No sessions remaining. Purchase more sessions to continue.", 402),
      };
    }

    return { ok: true, consumed: true, remaining: result.remaining ?? 0 };
  };

  const refundSession = async ({
    userId,
    planType,
    caseId,
    roundId,
    reason,
  }: {
    userId?: string | null;
    planType?: PlanType | string;
    caseId?: string | null;
    roundId?: string | null;
    reason?: string | null;
  }): Promise<void> => {
    if (!store || !userId) return;
    const planKey = normalizePlan(planType);
    await store.refund({
      userId,
      planType: planKey,
      caseId: caseId ?? null,
      roundId: roundId ?? null,
      reason: reason ?? null,
    });
  };

  return { consumeSession, refundSession };
};

const createSupabaseSessionStore = (): SessionStore | null => {
  if (!supabaseAdmin) return null;
  return {
    getProfile: async (userId) => {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .single();
      if (error || !data) return null;
      return data as { is_admin?: boolean };
    },
    consume: async ({ userId, planType, caseId, roundId, reason }) => {
      const { data, error } = await supabaseAdmin.rpc("consume_session", {
        p_user_id: userId,
        p_plan_type: planType,
        p_case_id: caseId,
        p_round_id: roundId,
        p_reason: reason,
      });
      if (error) {
        console.warn("Session consume failed:", error);
        return { consumed: false, remaining: null };
      }
      const row = Array.isArray(data) ? data[0] : data;
      return { consumed: !!row?.consumed, remaining: row?.remaining ?? null };
    },
    refund: async ({ userId, planType, caseId, roundId, reason }) => {
      const { error } = await supabaseAdmin.rpc("refund_session", {
        p_user_id: userId,
        p_plan_type: planType,
        p_case_id: caseId,
        p_round_id: roundId,
        p_reason: reason,
      });
      if (error) {
        console.warn("Session refund failed:", error);
      }
    },
  };
};

const sessionGuard = createSessionGuard(createSupabaseSessionStore());

export const consumeSession = sessionGuard.consumeSession;
export const refundSession = sessionGuard.refundSession;
