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

  const { originalText, instruction, planType } = body || {};
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
    const authHeader = request.headers.get("authorization");
    const authToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const modelSlug = await resolveModelSlug(planType, authToken);

    const text = await callOpenRouterChat({
      model: modelSlug,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return NextResponse.json({ text: text.trim() });
  } catch (error) {
    return NextResponse.json({ error: "Failed to revise text" }, { status: 500 });
  }
}
