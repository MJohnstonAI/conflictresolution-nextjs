import { NextRequest, NextResponse } from "next/server";
import {
  callOpenRouterChat,
  isOpenRouterError,
  resolveModelSlug,
  toOpenRouterErrorPayload,
} from "@/lib/server/openrouter";
import { rateLimit, retryAfterSeconds } from "@/lib/server/rate-limit";
import { requireAiAuth } from "@/lib/server/ai-auth";

export const runtime = "nodejs";

const DEFAULT_LIMIT_CHARS = 20000;
const TARGET_LIMIT_CHARS = 16000;

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: { message, upstreamStatus: status } }, { status });

const coerceLimit = (value: unknown) => {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) return DEFAULT_LIMIT_CHARS;
  return Math.min(Math.max(1, Math.floor(num)), DEFAULT_LIMIT_CHARS);
};

export async function POST(request: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return errorResponse("Missing OPENROUTER_API_KEY", 500);
  }

  const authGuard = await requireAiAuth(request);
  if (authGuard.ok === false) return authGuard.error;
  if (!authGuard.userId) {
    return errorResponse("Unauthorized", 401);
  }

  if (process.env.ENABLE_AI_RATE_LIMITING === "true") {
    const limit = await rateLimit(`message-summarize:${authGuard.userId}`, 2, 60_000);
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
    return errorResponse("Invalid JSON payload", 400);
  }

  const rawText = typeof body?.text === "string" ? body.text : "";
  if (!rawText.trim()) {
    return errorResponse("Missing text", 400);
  }

  const limitChars = coerceLimit(body?.limit);
  if (rawText.length <= limitChars) {
    return NextResponse.json({
      data: {
        text: rawText,
        summarized: false,
        originalLength: rawText.length,
        finalLength: rawText.length,
        limitChars,
      },
    });
  }

  const system = `
You are a professional condenser for adversary message transcripts in a conflict-resolution app.

Rewrite the message so it is shorter but preserves:
- the speaker's intent, tone, threats/ultimatums, accusations, deadlines, and key claims,
- any names, dates, amounts, and actionable asks,
- enough original phrasing to retain psychological cues.

Output rules:
- Return plain text only (no JSON, no markdown).
- Do NOT add new facts. Do NOT add commentary.
- Keep it <= ${limitChars} characters. Aim for <= ${Math.min(TARGET_LIMIT_CHARS, limitChars - 500)} characters.
`;

  const prompt = `
The user pasted an extremely long adversary message that exceeds the app limit.

Condense it to fit the limit while preserving the most important details and tone:

--- BEGIN ADVERSARY MESSAGE ---
${rawText}
--- END ADVERSARY MESSAGE ---
`;

  try {
    const modelSlug = await resolveModelSlug("premium", authGuard.token, authGuard.userId);
    const text = await callOpenRouterChat({
      model: modelSlug,
      messages: [
        { role: "system", content: system.trim() },
        { role: "user", content: prompt.trim() },
      ],
      planType: "premium",
      temperature: 0.2,
      max_tokens: 2500,
    });

    const summarized = text.trim();
    const finalText = summarized.length > limitChars ? summarized.slice(0, limitChars) : summarized;

    return NextResponse.json({
      data: {
        text: finalText,
        summarized: true,
        originalLength: rawText.length,
        finalLength: finalText.length,
        limitChars,
      },
    });
  } catch (error: any) {
    if (isOpenRouterError(error)) {
      return NextResponse.json(
        { error: toOpenRouterErrorPayload(error) },
        { status: error.upstreamStatus || 502 }
      );
    }
    const message = error?.message || "Failed to summarise message";
    return errorResponse(message, 500);
  }
}
