import { NextResponse } from "next/server";
import {
  fetchOpenRouterModels,
  isOpenRouterError,
  toOpenRouterErrorPayload,
} from "@/lib/server/openrouter";
import { requireAiAuth } from "@/lib/server/ai-auth";

export const runtime = "nodejs";

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: { message, upstreamStatus: status } }, { status });

export async function GET(request: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return errorResponse("Missing OPENROUTER_API_KEY", 500);
  }

  const authGuard = await requireAiAuth(request);
  if (authGuard.ok === false) return authGuard.error;

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
