import { NextRequest, NextResponse } from "next/server";
import {
  callOpenRouterChat,
  isOpenRouterError,
  resolveModelSlug,
  toOpenRouterErrorPayload,
} from "@/lib/server/openrouter";
import { getClientIp, rateLimit, retryAfterSeconds } from "@/lib/server/rate-limit";
import { requireAiAuth } from "@/lib/server/ai-auth";

export const runtime = "nodejs";

const DEFAULT_LIMIT_CHARS = 40000;
const TARGET_LIMIT_CHARS = 32000;

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
  if (!authGuard.ok) return authGuard.error;

  const ip = getClientIp(request);
  const limit = rateLimit(`context-summarize:${ip}`, 3, 60_000);
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
You are a professional summarizer for conflict-resolution case files.
Summarize the user's pasted case context into a shorter "case note" that preserves:
- identities/roles (who is who),
- key facts, dates, numbers, commitments,
- what the user wants,
- the latest ask / conflict trigger,
- any legal/contractual constraints mentioned.

Output rules:
- Return plain text only (no JSON, no markdown).
- Keep it concise but information-dense.
- Must be <= ${limitChars} characters. Aim for <= ${Math.min(TARGET_LIMIT_CHARS, limitChars - 1000)} characters.
`;

  const prompt = `
The user pasted an extremely long conflict context that exceeds the app limit.

Rewrite it as a concise case note:

--- BEGIN USER CONTEXT ---
${rawText}
--- END USER CONTEXT ---
`;

  try {
    const modelSlug = await resolveModelSlug("premium", authGuard.token);
    const text = await callOpenRouterChat({
      model: modelSlug,
      messages: [
        { role: "system", content: system.trim() },
        { role: "user", content: prompt.trim() },
      ],
      temperature: 0.2,
      max_tokens: 2000,
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
    const message = error?.message || "Failed to summarise context";
    return errorResponse(message, 500);
  }
}
