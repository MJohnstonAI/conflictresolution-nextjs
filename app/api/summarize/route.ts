import { NextRequest, NextResponse } from "next/server";
import {
  callOpenRouterChat,
  isOpenRouterError,
  resolveModelSlug,
  toOpenRouterErrorPayload,
} from "@/lib/server/openrouter";
import { requireAiAuth } from "@/lib/server/ai-auth";
import { rateLimit, retryAfterSeconds } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: { message: "Missing OPENROUTER_API_KEY", upstreamStatus: 500 } },
      { status: 500 }
    );
  }

  const authGuard = await requireAiAuth(request);
  if (authGuard.ok === false) return authGuard.error;
  if (!authGuard.userId) {
    return NextResponse.json(
      { error: { message: "Unauthorized", upstreamStatus: 401 } },
      { status: 401 }
    );
  }

  if (process.env.ENABLE_AI_RATE_LIMITING === "true") {
    const limit = await rateLimit(`summarize:${authGuard.userId}`, 4, 60_000);
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

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON payload", upstreamStatus: 400 } },
      { status: 400 }
    );
  }

  const { rounds, caseInfo } = body || {};
  if (!rounds || !caseInfo) {
    return NextResponse.json(
      { error: { message: "Missing rounds or caseInfo", upstreamStatus: 400 } },
      { status: 400 }
    );
  }

  const historyLog = rounds
    .map((r: any) => `[Round ${r.roundNumber}] Them: "${(r.opponentText || "").substring(0, 100)}..."`)
    .join("\n");

  const prompt = `
    Summarize this conflict case for a follow-up file.
    
    **DETAILS:**
    Title: ${caseInfo.title}
    Adversary: ${caseInfo.opponentType}
    Note: ${caseInfo.note}
    
    **HISTORY:**
    ${historyLog}
    
    **TASK:**
    Write a 1-paragraph summary.
  `;

  try {
    const modelSlug = await resolveModelSlug(caseInfo?.planType, authGuard.token, authGuard.userId);

    const text = await callOpenRouterChat({
      model: modelSlug,
      messages: [{ role: "user", content: prompt }],
      planType: caseInfo?.planType,
      temperature: 0.5,
      max_tokens: 500,
    });

    return NextResponse.json({ summary: text });
  } catch (error: any) {
    if (isOpenRouterError(error)) {
      return NextResponse.json(
        { error: toOpenRouterErrorPayload(error) },
        { status: error.upstreamStatus || 502 }
      );
    }
    const message = error?.message || "Failed to generate summary";
    return NextResponse.json({ error: { message, upstreamStatus: 500 } }, { status: 500 });
  }
}
