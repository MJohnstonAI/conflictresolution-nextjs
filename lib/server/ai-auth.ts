import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cleanEnvValue } from "@/lib/server/env";

type AuthGuardResult =
  | { ok: true; token: string | null; userId: string | null }
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

const authRequired = () => process.env.REQUIRE_AUTH_FOR_AI === "true";

export const getBearerToken = (request: Request) => {
  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
};

export const requireAiAuth = async (request: Request): Promise<AuthGuardResult> => {
  const token = getBearerToken(request);

  if (!token) {
    if (authRequired()) {
      return { ok: false, error: errorResponse("Unauthorized", 401) };
    }
    return { ok: true, token: null, userId: null };
  }

  if (!supabaseAdmin) {
    return { ok: false, error: errorResponse("Server configuration error", 500) };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    if (authRequired()) {
      return { ok: false, error: errorResponse("Unauthorized", 401) };
    }
    return { ok: true, token, userId: null };
  }

  return { ok: true, token, userId: data.user.id ?? null };
};
