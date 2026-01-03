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
    const limit = await rateLimit(`revise:${authGuard.userId}`, 6, 60_000);
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

  const { originalText, instruction, planType } = body || {};
  if (!originalText || !instruction) {
    return NextResponse.json(
      { error: { message: "Missing originalText or instruction", upstreamStatus: 400 } },
      { status: 400 }
    );
  }

  const prompt = `
    ORIGINAL DRAFT:
    "${originalText}"

    INSTRUCTION:
    ${instruction}

    TASK:
    Rewrite the draft to satisfy the instruction. 
    Keep the core message but change tone/length/style as requested.
    Use bullet points (- ) for lists and code blocks (\`\`\`) for legal text.
    Return ONLY the new text. No "Here is the rewritten text:" preambles.
  `;

  try {
    const modelSlug = await resolveModelSlug(planType, authGuard.token, authGuard.userId);

    const text = await callOpenRouterChat({
      model: modelSlug,
      messages: [{ role: "user", content: prompt }],
      planType,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return NextResponse.json({ text: text.trim() });
  } catch (error: any) {
    if (isOpenRouterError(error)) {
      return NextResponse.json(
        { error: toOpenRouterErrorPayload(error) },
        { status: error.upstreamStatus || 502 }
      );
    }
    const message = error?.message || "Failed to revise text";
    return NextResponse.json({ error: { message, upstreamStatus: 500 } }, { status: 500 });
  }
}
