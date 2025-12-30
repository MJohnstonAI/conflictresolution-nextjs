import { createClient } from "@supabase/supabase-js";
import { cleanEnvValue } from "@/lib/server/env";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

const supabaseUrl = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceRoleKey = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

const getStore = (): Map<string, RateLimitEntry> => {
  const g = globalThis as typeof globalThis & {
    __crRateLimitStore?: Map<string, RateLimitEntry>;
  };
  if (!g.__crRateLimitStore) {
    g.__crRateLimitStore = new Map<string, RateLimitEntry>();
  }
  return g.__crRateLimitStore;
};

export const getClientIp = (request: Request): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;
  return "unknown";
};

const rateLimitLocal = (key: string, max: number, windowMs: number): RateLimitResult => {
  const store = getStore();
  const now = Date.now();
  const nextResetAt = now + windowMs;

  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: nextResetAt });
    return { allowed: true, remaining: Math.max(0, max - 1), resetAt: nextResetAt };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  store.set(key, entry);
  return { allowed: true, remaining: Math.max(0, max - entry.count), resetAt: entry.resetAt };
};

export const rateLimit = async (
  key: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> => {
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin.rpc("rate_limit", {
      p_key: key,
      p_max: max,
      p_window_ms: windowMs,
    });
    if (!error && data) {
      const row = Array.isArray(data) ? data[0] : data;
      if (row && typeof row.allowed === "boolean") {
        return {
          allowed: row.allowed,
          remaining: Number(row.remaining) || 0,
          resetAt: Number(row.reset_at) || Date.now() + windowMs,
        };
      }
    }
  }

  return rateLimitLocal(key, max, windowMs);
};

export const retryAfterSeconds = (resetAt: number) =>
  Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
