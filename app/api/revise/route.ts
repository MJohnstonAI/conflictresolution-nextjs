import { NextRequest, NextResponse } from "next/server";
import {
  callOpenRouterChat,
  isOpenRouterError,
  resolveModelSlug,
  toOpenRouterErrorPayload,
} from "@/lib/server/openrouter";
import { requireAiAuth } from "@/lib/server/ai-auth";
import { requireCaseAccess } from "@/lib/server/ai-case-guard";

export const runtime = "nodejs";

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: { message, upstreamStatus: status } }, { status });

export async function POST(request: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return errorResponse("Missing OPENROUTER_API_KEY", 500);
  }

  const authGuard = await requireAiAuth(request);
  if (authGuard.ok === false) return authGuard.error;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON payload", 400);
  }

  const { originalText, instruction, planType, caseId } = body || {};
  if (planType === "demo") {
    return errorResponse("Demo mode does not call AI", 400);
  }
  if (!originalText || !instruction) {
    return errorResponse("Missing originalText or instruction", 400);
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
    const caseGuard = await requireCaseAccess({
      caseId: typeof caseId === "string" ? caseId : null,
      userId: authGuard.userId,
      planType,
      requireOpen: false,
    });
    if (caseGuard.ok === false) return caseGuard.error;

    const modelSlug = await resolveModelSlug(planType, authGuard.token);

    const text = await callOpenRouterChat({
      model: modelSlug,
      messages: [{ role: "user", content: prompt }],
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
