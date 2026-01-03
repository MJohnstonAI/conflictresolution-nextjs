import { NextRequest, NextResponse } from "next/server";
import {
  callOpenRouterChat,
  isOpenRouterError,
  resolveModelSlug,
  toOpenRouterErrorPayload,
} from "@/lib/server/openrouter";
import { getClientIp, rateLimit, retryAfterSeconds } from "@/lib/server/rate-limit";
import { requireAiAuth } from "@/lib/server/ai-auth";
import { requireCaseAccess } from "@/lib/server/ai-case-guard";
import { consumeSession, refundSession } from "@/lib/server/session-guard";

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

  if (process.env.ENABLE_AI_RATE_LIMITING === "true") {
    const ip = getClientIp(request);
    const limit = await rateLimit(`analyze:${ip}`, 8, 60_000);
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

  const {
    caseId,
    opponentType,
    contextSummary,
    historyText,
    currentText,
    planType,
    useDeepThinking,
    senderIdentity,
  } = body || {};

  if (planType === "demo") {
    return NextResponse.json(
      { error: { message: "Demo mode does not call AI", upstreamStatus: 400 } },
      { status: 400 }
    );
  }

  const MAX_INPUT_CHARS = 20000;
  const CONTEXT_SUMMARY_LIMIT_CHARS = 40000;
  const BUSINESS_OUTPUT_LIMIT = 2000;
  const truncatedText = (currentText || "").slice(0, MAX_INPUT_CHARS);
  const truncatedContextSummary =
    typeof contextSummary === "string" ? contextSummary.slice(0, CONTEXT_SUMMARY_LIMIT_CHARS) : "";

  const caseGuard = await requireCaseAccess({
    caseId: typeof caseId === "string" ? caseId : null,
    userId: authGuard.userId,
    planType,
    requireOpen: true,
  });
  if (caseGuard.ok === false) return caseGuard.error;

  const SYSTEM_INSTRUCTION = `
You are Conflict Resolution AI.
You are NOT a lawyer.

**TASK**
Analyze the input and generate 4 strategic response drafts.
Vibe check should be 2-3 short sentences.

**RESPONSE FORMATTING STANDARDS:**
1. **Structure:** Use clear, distinct paragraphs separated by "\\n\\n".
2. **Lists:** Use **bullet points** ("- ") for any lists, steps, or multiple options within a response.
3. **Legal/Contractual Text:** You MUST use **code blocks** (\`\`\`) to wrap any specific legal clauses, proposed contract amendments, or formal citations.
4. **Emphasis:** Use asterisks for **bold** text on key terms.

**CRITICAL JSON FORMATTING RULES:**
1. Output MUST be valid JSON.
2. Do NOT use newlines/line-breaks inside string values. Replace all newlines with a single space or literal "\\n".
3. Do NOT include markdown formatting (like \`\`\`json). Just the raw JSON object.
4. Do NOT use double quotes (") inside string values. Use single quotes (') instead. This is critical for parsing.
5. Keep the total character count concise.

**MODES:**
1. PEACEKEEPER: De-escalate.
2. BARRISTER: Factual, cool, detached. Use code blocks for specific demands or legal citations.
3. GREY ROCK: Boring, short, no emotion. No J.A.D.E. (Justify, Argue, Defend, Explain).
4. NUCLEAR: Witty, assertive, exposes behavior. Savage but legal.
`;

  const ANALYSIS_SCHEMA = `
{
  "vibeCheck": "string - 2-3 sentences emotional analysis.",
  "confidenceScore": 0,
  "confidenceExplanation": "string - short reason.",
  "legalRiskScore": 0,
  "legalRiskExplanation": "string - short explanation.",
  "detectedFallacies": ["string"],
  "analysisSummary": "string - concise summary of their key points.",
  "responses": {
    "soft": "string - Peacekeeper draft",
    "firm": "string - Barrister draft",
    "nuclear": "string - Nuclear draft",
    "greyRock": "string - Grey Rock draft"
  }
}
`;

  const prompt = `
    **CONTEXT:**
    Adversary: ${opponentType}
    Note: ${truncatedContextSummary}

    **HISTORY:**
    ${historyText ? historyText : "(None)"}

    **LATEST MESSAGE (Analyze This):**
    ${senderIdentity ? `From: ${senderIdentity}` : ""}
    "${truncatedText}"

    Return JSON matching this schema:
    ${ANALYSIS_SCHEMA}
  `;

  let maxOutputTokens = BUSINESS_OUTPUT_LIMIT;
  if (planType === "premium" && useDeepThinking) {
    maxOutputTokens = 4000;
  }

  let sessionConsumed = false;

  try {
    const sessionGuard = await consumeSession({
      userId: authGuard.userId,
      planType,
      caseId: typeof caseId === "string" ? caseId : null,
      roundId: null,
      reason: "analysis",
    });
    if (sessionGuard.ok === false) return sessionGuard.error;
    sessionConsumed = sessionGuard.consumed;

    const modelSlug = await resolveModelSlug(planType, authGuard.token);

    const text = await callOpenRouterChat({
      model: modelSlug,
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: prompt },
      ],
      planType,
      temperature: 0.7,
      max_tokens: maxOutputTokens,
    });
    if (!text) throw new Error("No text generated by AI.");

    let jsonString = text.trim();
    jsonString = jsonString.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");

    const firstOpen = jsonString.indexOf("{");
    const lastClose = jsonString.lastIndexOf("}");
    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      jsonString = jsonString.substring(firstOpen, lastClose + 1);
    }

    jsonString = jsonString.replace(/[\n\r]+/g, " ");

    const parsed = JSON.parse(jsonString);
    return NextResponse.json({ ...parsed, modelSlug });
  } catch (error: any) {
    if (sessionConsumed) {
      await refundSession({
        userId: authGuard.userId,
        planType,
        caseId: typeof caseId === "string" ? caseId : null,
        roundId: null,
        reason: "analysis_failed_refund",
      });
    }
    if (isOpenRouterError(error)) {
      return NextResponse.json(
        { error: toOpenRouterErrorPayload(error) },
        { status: error.upstreamStatus || 502 }
      );
    }

    const message = error?.message || "AI Generation Failed";
    return NextResponse.json({ error: { message, upstreamStatus: 500 } }, { status: 500 });
  }
}
