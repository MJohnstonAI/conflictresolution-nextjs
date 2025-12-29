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

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: { message, upstreamStatus: status } }, { status });

const coercePositiveInt = (value: unknown, fallback: number) => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) && num > 0 ? Math.floor(num) : fallback;
};

export async function POST(request: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return errorResponse("Missing OPENROUTER_API_KEY", 500);
  }

  const authGuard = await requireAiAuth(request);
  if (authGuard.ok === false) return authGuard.error;
  if (!authGuard.userId) {
    return errorResponse("Sign in required to run a Session.", 401);
  }

  const ip = getClientIp(request);
  const limit = rateLimit(`analyze:${ip}`, 8, 60_000);
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

  const {
    caseId,
    opponentType,
    contextSummary,
    historyText,
    currentText,
    planType,
    useDeepThinking,
    senderIdentity,
    roundId,
  } = body || {};

  if (planType === "demo") {
    return errorResponse("Demo mode does not call AI", 400);
  }

  const MAX_INPUT_CHARS = 15000;
  const HISTORY_LIMIT_CHARS = 6000;
  const CONTEXT_SUMMARY_LIMIT_CHARS = 40000;
  const OPPONENT_LIMIT_CHARS = 80;
  const SENDER_LIMIT_CHARS = 80;
  const BUSINESS_OUTPUT_LIMIT = 2000;
  const contextBudget = coercePositiveInt(process.env.ANALYZE_CONTEXT_BUDGET_CHARS, 8000);
  const historyBudget = coercePositiveInt(process.env.ANALYZE_HISTORY_BUDGET_CHARS, 2000);
  const summarizeContext = process.env.ENABLE_ANALYZE_CONTEXT_SUMMARY === "true";
  const truncatedText = (currentText || "").slice(0, MAX_INPUT_CHARS);
  const truncatedContextSummary =
    typeof contextSummary === "string" ? contextSummary.slice(0, CONTEXT_SUMMARY_LIMIT_CHARS) : "";
  const truncatedHistoryText =
    typeof historyText === "string" ? historyText.slice(0, HISTORY_LIMIT_CHARS) : "";
  const safeOpponentType = typeof opponentType === "string" ? opponentType.slice(0, OPPONENT_LIMIT_CHARS) : "";
  const safeSenderIdentity =
    typeof senderIdentity === "string" ? senderIdentity.slice(0, SENDER_LIMIT_CHARS) : "";

  const SYSTEM_INSTRUCTION = `
You are Conflict Resolution AI.
You are NOT a lawyer.

**TASK**
Analyze the input and generate 4 strategic response drafts.

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
  "vibeCheck": "string - 1 sentence emotional analysis.",
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

  let maxOutputTokens = BUSINESS_OUTPUT_LIMIT;
  if (planType === "premium" && useDeepThinking) {
    maxOutputTokens = 4000;
  }

  let sessionConsumed = false;

  try {
    const caseGuard = await requireCaseAccess({
      caseId: typeof caseId === "string" ? caseId : null,
      userId: authGuard.userId,
      planType,
      requireOpen: true,
    });
    if (caseGuard.ok === false) return caseGuard.error;

    const sessionGuard = await consumeSession({
      userId: authGuard.userId,
      planType,
      caseId: typeof caseId === "string" ? caseId : null,
      roundId: typeof roundId === "string" ? roundId : null,
      reason: "generation",
    });
    if (sessionGuard.ok === false) return sessionGuard.error;
    sessionConsumed = sessionGuard.consumed;

    const modelSlug = await resolveModelSlug(planType, authGuard.token);

    const summarizeForAnalyze = async (label: string, text: string, limitChars: number) => {
      const system = `
You are summarizing conflict case input for a downstream AI prompt.
Preserve identities, facts, dates, threats, asks, and key emotional tone.
Return plain text only. No markdown. Keep it <= ${limitChars} characters.
`;
      const prompt = `
Summarize the following ${label} to fit within the limit while preserving critical details:

--- BEGIN ${label.toUpperCase()} ---
${text}
--- END ${label.toUpperCase()} ---
`;
      const summary = await callOpenRouterChat({
        model: modelSlug,
        messages: [
          { role: "system", content: system.trim() },
          { role: "user", content: prompt.trim() },
        ],
        temperature: 0.2,
        max_tokens: 1200,
      });
      const trimmed = summary.trim();
      return trimmed.length > limitChars ? trimmed.slice(0, limitChars) : trimmed;
    };

    let finalContextSummary = truncatedContextSummary;
    let finalHistoryText = truncatedHistoryText;

    if (summarizeContext) {
      const boundedContextBudget = Math.min(contextBudget, CONTEXT_SUMMARY_LIMIT_CHARS);
      const boundedHistoryBudget = Math.min(historyBudget, HISTORY_LIMIT_CHARS);
      if (finalContextSummary.length > boundedContextBudget) {
        try {
          finalContextSummary = await summarizeForAnalyze("case context", finalContextSummary, boundedContextBudget);
        } catch {
          finalContextSummary = finalContextSummary.slice(0, boundedContextBudget);
        }
      }
      if (finalHistoryText.length > boundedHistoryBudget) {
        try {
          finalHistoryText = await summarizeForAnalyze("recent history", finalHistoryText, boundedHistoryBudget);
        } catch {
          finalHistoryText = finalHistoryText.slice(0, boundedHistoryBudget);
        }
      }
    }

    const prompt = `
    **CONTEXT:**
    Adversary: ${safeOpponentType}
    Note: ${finalContextSummary}

    **HISTORY:**
    ${finalHistoryText ? finalHistoryText : "(None)"}

    **LATEST MESSAGE (Analyze This):**
    ${safeSenderIdentity ? `From: ${safeSenderIdentity}` : ""}
    "${truncatedText}"

    Return JSON matching this schema:
    ${ANALYSIS_SCHEMA}
  `;

    const text = await callOpenRouterChat({
      model: modelSlug,
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: prompt },
      ],
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
        roundId: typeof roundId === "string" ? roundId : null,
        reason: "generation_failed",
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
