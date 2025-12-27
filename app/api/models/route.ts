import { NextResponse } from "next/server";
import {
  fetchOpenRouterModels,
  isOpenRouterError,
  toOpenRouterErrorPayload,
} from "@/lib/server/openrouter";

export const runtime = "nodejs";

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: { message, upstreamStatus: status } }, { status });

type ModelsCache = {
  payload: any;
  expiresAt: number;
};

const getModelsCache = (): ModelsCache | null => {
  const g = globalThis as typeof globalThis & { __crModelsCache?: ModelsCache };
  return g.__crModelsCache || null;
};

const setModelsCache = (payload: any, ttlMs: number) => {
  const g = globalThis as typeof globalThis & { __crModelsCache?: ModelsCache };
  g.__crModelsCache = { payload, expiresAt: Date.now() + ttlMs };
};

const getTtlMs = () => {
  const raw = Number(process.env.OPENROUTER_MODELS_TTL_MS || 600000);
  return Number.isFinite(raw) && raw > 0 ? raw : 600000;
};

export async function GET() {
  if (!process.env.OPENROUTER_API_KEY) {
    return errorResponse("Missing OPENROUTER_API_KEY", 500);
  }

  const ttlMs = getTtlMs();
  const cache = getModelsCache();
  if (cache && cache.expiresAt > Date.now()) {
    return NextResponse.json(cache.payload, { headers: { "X-Cache": "hit" } });
  }

  try {
    const models = await fetchOpenRouterModels();
    setModelsCache(models, ttlMs);
    return NextResponse.json(models, { headers: { "X-Cache": "miss" } });
  } catch (error) {
    if (isOpenRouterError(error)) {
      if (cache) {
        return NextResponse.json(cache.payload, { headers: { "X-Cache": "stale" } });
      }
      return NextResponse.json(
        { error: toOpenRouterErrorPayload(error) },
        { status: error.upstreamStatus || 502 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to fetch models";
    if (cache) {
      return NextResponse.json(cache.payload, { headers: { "X-Cache": "stale" } });
    }
    return errorResponse(message, 500);
  }
}
