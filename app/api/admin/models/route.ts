import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: { message } }, { status });

const getBearerToken = (request: Request) => {
  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
};

const requireAdmin = async (request: Request) => {
  if (!supabaseAdmin) {
    return { error: errorResponse("Server configuration error", 500) };
  }
  const token = getBearerToken(request);
  if (!token) {
    return { error: errorResponse("Unauthorized", 401) };
  }
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return { error: errorResponse("Unauthorized", 401) };
  }
  const user = data.user;
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (profileError) {
    return { error: errorResponse("Unauthorized", 401) };
  }
  const isAdmin = !!profile?.is_admin || user.email === "marcaj777@gmail.com";
  if (!isAdmin) {
    return { error: errorResponse("Forbidden", 403) };
  }
  return { user };
};

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  if (!supabaseAdmin) {
    return errorResponse("Server configuration error", 500);
  }

  const { data, error } = await supabaseAdmin
    .from("ai_models")
    .select("id, plan_type, model_slug")
    .in("plan_type", ["standard", "premium"]);
  if (error) {
    return errorResponse("Failed to load model settings", 500);
  }

  const standard = data?.find((row) => row.plan_type === "standard");
  const premium = data?.find((row) => row.plan_type === "premium");

  return NextResponse.json({
    data: {
      standard: standard ? { id: standard.id, modelSlug: standard.model_slug } : null,
      premium: premium ? { id: premium.id, modelSlug: premium.model_slug } : null,
    },
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  if (!supabaseAdmin) {
    return errorResponse("Server configuration error", 500);
  }

  let body: any = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const planType = body?.planType;
  const modelSlug = typeof body?.modelSlug === "string" ? body.modelSlug.trim() : "";

  if (planType !== "standard" && planType !== "premium") {
    return errorResponse("Invalid plan type", 400);
  }
  if (!modelSlug) {
    return errorResponse("Invalid model slug", 400);
  }

  const { error } = await supabaseAdmin
    .from("ai_models")
    .update({ model_slug: modelSlug, updated_at: new Date().toISOString() })
    .eq("plan_type", planType);
  if (error) {
    return errorResponse("Failed to update model setting", 500);
  }

  return NextResponse.json({ data: { planType, modelSlug } });
}
