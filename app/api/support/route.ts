import { NextRequest, NextResponse } from "next/server";
import { cleanEnvValue } from "@/lib/server/env";

export const runtime = "nodejs";

const RESEND_API_KEY = cleanEnvValue(process.env.RESEND_API_KEY);
const TURNSTILE_SECRET_KEY =
  cleanEnvValue(process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY) ||
  cleanEnvValue(process.env.TURNSTILE_SECRET_KEY);

const SUPPORT_FROM = "support@resolvethedisputes.com";
const SUPPORT_TO = "support@resolvethedisputes.com";
const SUPPORT_SUBJECT = "Customer Enquiry Conflict Resolution";

const MIN_SUBMIT_TIME_MS = 2000;
const MAX_MESSAGE_LENGTH = 4000;

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: { message, upstreamStatus: status } }, { status });

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getClientIp = (request: NextRequest) => {
  const header = request.headers.get("x-forwarded-for") || "";
  if (!header) return "";
  return header.split(",")[0]?.trim() || "";
};

export async function POST(request: NextRequest) {
  if (!RESEND_API_KEY) {
    return errorResponse("Missing RESEND_API_KEY", 500);
  }
  if (!TURNSTILE_SECRET_KEY) {
    return errorResponse("Missing CLOUDFLARE_TURNSTILE_SECRET_KEY", 500);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON payload", 400);
  }

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const topic = typeof body?.topic === "string" ? body.topic.trim() : "General Inquiry";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const trap = typeof body?.trap === "string" ? body.trap.trim() : "";
  const startedAt =
    typeof body?.startedAt === "number" ? body.startedAt : Number(body?.startedAt);
  const turnstileToken =
    typeof body?.turnstileToken === "string" ? body.turnstileToken.trim() : "";

  if (trap) {
    return NextResponse.json({ data: { ok: true } });
  }

  if (!email || !isValidEmail(email)) {
    return errorResponse("Please provide a valid email address.", 400);
  }

  if (!message || message.length < 5) {
    return errorResponse("Please enter a longer message.", 400);
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return errorResponse("Message exceeds 4,000 characters.", 400);
  }

  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    return errorResponse("Invalid submission timestamp.", 400);
  }

  const elapsed = Date.now() - startedAt;
  if (elapsed < MIN_SUBMIT_TIME_MS) {
    return errorResponse("Please take a moment before submitting.", 400);
  }

  if (!turnstileToken) {
    return errorResponse("Missing Turnstile token.", 400);
  }

  const verifyParams = new URLSearchParams({
    secret: TURNSTILE_SECRET_KEY,
    response: turnstileToken,
  });
  const clientIp = getClientIp(request);
  if (clientIp) verifyParams.set("remoteip", clientIp);

  const turnstileResponse = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verifyParams.toString(),
    }
  );

  if (!turnstileResponse.ok) {
    return errorResponse("Turnstile verification failed.", 502);
  }

  const turnstilePayload = await turnstileResponse.json().catch(() => null);
  if (!turnstilePayload?.success) {
    return errorResponse("Turnstile verification failed.", 400);
  }

  const userAgent = request.headers.get("user-agent") || "unknown";
  const timestamp = new Date().toISOString();
  const textBody = [
    "New support enquiry received.",
    `From: ${email}`,
    `Topic: ${topic || "General Inquiry"}`,
    `Time: ${timestamp}`,
    `IP: ${clientIp || "unknown"}`,
    `User Agent: ${userAgent}`,
    "",
    message,
  ].join("\n");

  const htmlBody = `
    <h2>New support enquiry received</h2>
    <p><strong>From:</strong> ${escapeHtml(email)}</p>
    <p><strong>Topic:</strong> ${escapeHtml(topic || "General Inquiry")}</p>
    <p><strong>Time:</strong> ${escapeHtml(timestamp)}</p>
    <p><strong>IP:</strong> ${escapeHtml(clientIp || "unknown")}</p>
    <p><strong>User Agent:</strong> ${escapeHtml(userAgent)}</p>
    <hr />
    <pre style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(message)}</pre>
  `;

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: SUPPORT_FROM,
      to: [SUPPORT_TO],
      reply_to: email,
      subject: SUPPORT_SUBJECT,
      text: textBody,
      html: htmlBody,
    }),
  });

  const resendPayload = await resendResponse.json().catch(() => null);
  if (!resendResponse.ok) {
    const message =
      resendPayload?.message ||
      resendPayload?.error ||
      "Failed to send support message.";
    return errorResponse(message, 502);
  }

  return NextResponse.json({ data: { ok: true } });
}
