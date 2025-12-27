type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

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

export const rateLimit = (key: string, max: number, windowMs: number): RateLimitResult => {
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

export const retryAfterSeconds = (resetAt: number) =>
  Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));

