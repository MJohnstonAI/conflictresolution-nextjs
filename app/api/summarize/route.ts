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
  if (!authGuard.ok) return authGuard.error;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON payload", 400);
  }

  const { rounds, caseInfo } = body || {};
  if (!rounds || !caseInfo) {
    return errorResponse("Missing rounds or caseInfo", 400);
  }
  if (caseInfo?.planType === "demo") {
    return errorResponse("Demo mode does not call AI", 400);
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
    const caseGuard = await requireCaseAccess({
      caseId: typeof caseInfo?.id === "string" ? caseInfo.id : null,
      userId: authGuard.userId,
      planType: caseInfo?.planType,
      requireOpen: false,
    });
    if (!caseGuard.ok) return caseGuard.error;

    const modelSlug = await resolveModelSlug(caseInfo?.planType, authGuard.token);

    const text = await callOpenRouterChat({
      model: modelSlug,
      messages: [{ role: "user", content: prompt }],
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
