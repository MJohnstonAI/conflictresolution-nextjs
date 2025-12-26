import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!process.env.API_KEY) {
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

  const modelName = caseInfo.planType === "premium" ? "gemini-3-pro-preview" : "gemini-3-flash-preview";

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: { maxOutputTokens: 500, temperature: 0.5 },
    });

    return NextResponse.json({ summary: response.text || "" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
