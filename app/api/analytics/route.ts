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
  NextResponse.json({ error: { message } }, { status });

const sanitizeMetadata = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const payload = value as Record<string, unknown>;
  const allowedKeys = ["planType", "isDemo", "isRerun", "source", "tier", "product", "quantity"];
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => allowedKeys.includes(key))
  );
};

export async function POST(request: Request) {
  let body: any = null;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON payload", 400);
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return errorResponse("Missing event name", 400);
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ ok: true });
  }

  const token = getBearerToken(request);
  let userId: string | null = null;
  if (token) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data?.user?.id) {
      userId = data.user.id;
    }
  }

  const path = typeof body?.path === "string" ? body.path.slice(0, 120) : null;
  const metadata = sanitizeMetadata(body?.metadata);
  const createdAt = typeof body?.ts === "number" ? new Date(body.ts).toISOString() : new Date().toISOString();

  const { error } = await supabaseAdmin.from("analytics_events").insert({
    user_id: userId,
    event_name: name,
    metadata,
    path,
    created_at: createdAt,
  });

  if (error) {
    return errorResponse(error.message || "Failed to record event", 500);
  }

  return NextResponse.json({ ok: true });
}
