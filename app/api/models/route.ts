import { NextResponse } from "next/server";
import {
  fetchOpenRouterModels,
  isOpenRouterError,
  toOpenRouterErrorPayload,
} from "@/lib/server/openrouter";
import { requireAiAuth } from "@/lib/server/ai-auth";
import { rateLimit, retryAfterSeconds } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: { message, upstreamStatus: status } }, { status });

export async function GET(request: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return errorResponse("Missing OPENROUTER_API_KEY", 500);
  }

  const authGuard = await requireAiAuth(request);
  if (authGuard.ok === false) return authGuard.error;
  if (!authGuard.userId) {
    return errorResponse("Unauthorized", 401);
  }

  if (process.env.ENABLE_AI_RATE_LIMITING === "true") {
    const limit = await rateLimit(`models:${authGuard.userId}`, 10, 60_000);
    if (!limit.allowed) {
      const retryAfter = retryAfterSeconds(limit.resetAt);
      return NextResponse.json(
        {
          error: {
            message: `Rate limit exceeded. Please wait ${retryAfter}s and try again.`,
            upstreamStatus: 429,
          },
        },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
  }

  try {
    const models = await fetchOpenRouterModels();
    return NextResponse.json(models);
  } catch (error) {
    if (isOpenRouterError(error)) {
      return NextResponse.json(
        { error: toOpenRouterErrorPayload(error) },
        { status: error.upstreamStatus || 502 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to fetch models";
    return errorResponse(message, 500);
  }
}
