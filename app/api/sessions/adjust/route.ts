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

export async function POST(request: Request) {
  const authGuard = await requireAiAuth(request);
  if (authGuard.ok === false) return authGuard.error;
  if (!authGuard.userId) return errorResponse("Unauthorized", 401);
  if (!supabaseAdmin) return errorResponse("Server configuration error", 500);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON payload", 400);
  }

  const planType =
    body?.planType === "premium" ? "premium" : body?.planType === "standard" ? "standard" : null;
  const delta = Number(body?.delta);
  const reason = typeof body?.reason === "string" ? body.reason : "purchase";

  if (!planType || (planType !== "standard" && planType !== "premium")) {
    return errorResponse("Invalid plan type", 400);
  }
  if (!Number.isFinite(delta) || delta <= 0) {
    return errorResponse("Delta must be a positive integer", 400);
  }

  const { data, error } = await supabaseAdmin.rpc("grant_sessions", {
    p_user_id: authGuard.userId,
    p_plan_type: planType,
    p_delta: Math.floor(delta),
    p_reason: reason,
  });

  if (error || !data) {
    return errorResponse("Session ledger unavailable", 500);
  }

  const row = Array.isArray(data) ? data[0] : data;
  const remaining = Number(row?.remaining) || 0;

  return NextResponse.json({ data: { remaining } });
}
