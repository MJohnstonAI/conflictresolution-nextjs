import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cleanEnvValue } from "@/lib/server/env";
import { fetchOpenRouterModels } from "@/lib/server/openrouter";

export const runtime = "nodejs";

const supabaseUrl = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceRoleKey = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

const checkDatabase = async () => {
  if (!supabaseAdmin) return false;
  const { error } = await supabaseAdmin.from("profiles").select("id").limit(1);
  return !error;
};

const checkAi = async () => {
  if (!process.env.OPENROUTER_API_KEY) return false;
  try {
    await fetchOpenRouterModels();
    return true;
  } catch {
    return false;
  }
};

export async function GET() {
  const [database, ai] = await Promise.all([checkDatabase(), checkAi()]);
  return NextResponse.json({ data: { database, ai } });
}
