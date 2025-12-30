import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cleanEnvValue } from "@/lib/server/env";
import { getBearerToken } from "@/lib/server/ai-auth";

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

export async function GET(request: Request) {
  if (!supabaseAdmin) {
    return errorResponse("Server configuration error", 500);
  }

  const token = getBearerToken(request);
  if (!token) {
    return errorResponse("Unauthorized", 401);
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData?.user?.id) {
    return errorResponse("Unauthorized", 401);
  }

  const userId = authData.user.id;

  const [sessionResult, purchaseResult] = await Promise.all([
    supabaseAdmin
      .from("session_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("purchase_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (sessionResult.error) {
    return errorResponse(sessionResult.error.message || "Failed to load session events", 500);
  }

  return NextResponse.json({
    sessionEvents: sessionResult.data || [],
    purchaseEvents: purchaseResult.error ? [] : purchaseResult.data || [],
    purchaseError: purchaseResult.error?.message ?? null,
  });
}
