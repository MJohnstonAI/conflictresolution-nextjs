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

  const { originalText, instruction } = body || {};
  if (!originalText || !instruction) {
    return NextResponse.json({ error: "Missing originalText or instruction" }, { status: 400 });
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return NextResponse.json({ text: response.text?.trim() || "" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to revise text" }, { status: 500 });
  }
}
