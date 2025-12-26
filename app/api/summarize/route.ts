import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterChat, resolveModelSlug } from "@/lib/server/openrouter";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { rounds, caseInfo } = body || {};
  if (!rounds || !caseInfo) {
    return NextResponse.json({ error: "Missing rounds or caseInfo" }, { status: 400 });
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
    const authHeader = request.headers.get("authorization");
    const authToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const modelSlug = await resolveModelSlug(caseInfo?.planType, authToken);

    const text = await callOpenRouterChat({
      model: modelSlug,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 500,
    });

    return NextResponse.json({ summary: text });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
