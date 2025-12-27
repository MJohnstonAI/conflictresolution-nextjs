import { createClient } from "@supabase/supabase-js";
import type { PlanType } from "@/types";

type PlanKey = "standard" | "premium";
type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type OpenRouterErrorDetails = {
  message: string;
  code?: string;
  upstreamStatus?: number;
  requestId?: string | null;
};

export class OpenRouterError extends Error {
  code?: string;
  upstreamStatus?: number;
  requestId?: string | null;

  constructor(details: OpenRouterErrorDetails) {
    super(details.message);
    this.code = details.code;
    this.upstreamStatus = details.upstreamStatus;
    this.requestId = details.requestId;
  }
}

export const isOpenRouterError = (error: unknown): error is OpenRouterError =>
  error instanceof OpenRouterError;

export const toOpenRouterErrorPayload = (error: OpenRouterError): OpenRouterErrorDetails => ({
  message: error.message,
  code: error.code,
  upstreamStatus: error.upstreamStatus,
  requestId: error.requestId ?? undefined,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openRouterKey = process.env.OPENROUTER_API_KEY;
const openRouterBaseUrl = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const openRouterReferer = process.env.OPENROUTER_REFERER || "https://localhost:3000";
const openRouterTitle = process.env.OPENROUTER_TITLE || "conflictresolution-nextjs";
const openRouterRetryMax = Number(process.env.OPENROUTER_RETRY_MAX || 3);
const openRouterRetryBaseMs = Number(process.env.OPENROUTER_RETRY_BASE_MS || 800);
const openRouterRetryMaxMs = Number(process.env.OPENROUTER_RETRY_MAX_MS || 8000);

const parsePositiveNumber = (value: number, fallback: number) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

const openRouterTimeoutMs = parsePositiveNumber(Number(process.env.OPENROUTER_TIMEOUT_MS || 30000), 30000);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryStatus = (status: number) => status === 429 || status === 502 || status === 503 || status === 504;

const buildOpenRouterHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${openRouterKey}`,
    "Content-Type": "application/json",
  };
  if (openRouterReferer) {
    headers["HTTP-Referer"] = openRouterReferer;
  }
  if (openRouterTitle) {
    headers["X-Title"] = openRouterTitle;
  }
  return headers;
};

const getRequestId = (response: Response) =>
  response.headers.get("x-openrouter-request-id") || response.headers.get("x-request-id");

const readResponsePayload = async (response: Response) => {
  const responseText = await response.text();
  let payload: any = null;
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = null;
    }
  }
  return { responseText, payload };
};

const createOpenRouterError = (response: Response, payload: any, responseText: string) => {
  const message =
    payload?.error?.message || payload?.message || responseText || `OpenRouter error ${response.status}`;
  const rawCode = payload?.error?.code || payload?.code;
  const code =
    typeof rawCode === "string"
      ? rawCode
      : typeof rawCode === "number" && Number.isFinite(rawCode)
        ? String(rawCode)
        : undefined;
  return new OpenRouterError({
    message,
    code,
    upstreamStatus: response.status,
    requestId: getRequestId(response),
  });
};

const createTimeoutSignal = (timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, cancel: () => clearTimeout(timeout) };
};

const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

const normalizePlan = (planType?: PlanType | string): PlanKey =>
  planType === "premium" ? "premium" : "standard";

const getUserIdFromToken = async (authToken?: string | null): Promise<string | null> => {
  if (!authToken || !supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(authToken);
  if (error) return null;
  return data?.user?.id ?? null;
};

export const resolveModelSlug = async (
  planType?: PlanType | string,
  authToken?: string | null
): Promise<string> => {
  if (!supabaseAdmin) {
    throw new Error("Server configuration error");
  }

  const planKey = normalizePlan(planType);
  const profileColumn = planKey === "premium" ? "premium_model_id" : "standard_model_id";

  const userId = await getUserIdFromToken(authToken);
  let profileModelId: number | null = null;

  if (userId) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(profileColumn)
      .eq("id", userId)
      .single();
    if (!error) {
      profileModelId = (data as Record<string, number | null>)?.[profileColumn] ?? null;
    }
  }

  let modelId = profileModelId;
  let modelSlug: string | null = null;

  if (!modelId) {
    const { data, error } = await supabaseAdmin
      .from("ai_models")
      .select("id, model_slug")
      .eq("plan_type", planKey)
      .single();

    if (error || !data?.id || !data?.model_slug) {
      throw new Error("Model configuration error");
    }

    modelId = data.id;
    modelSlug = data.model_slug;

    if (userId && profileModelId === null) {
      await supabaseAdmin.from("profiles").update({ [profileColumn]: modelId }).eq("id", userId);
    }
  }

  if (!modelSlug) {
    const { data, error } = await supabaseAdmin
      .from("ai_models")
      .select("model_slug")
      .eq("id", modelId)
      .single();
    if (error || !data?.model_slug) {
      throw new Error("Model configuration error");
    }
    modelSlug = data.model_slug;
  }

  return modelSlug;
};

export const callOpenRouterChat = async (params: {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}): Promise<string> => {
  if (!openRouterKey) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  const headers = buildOpenRouterHeaders();
  const maxAttempts = Math.max(1, parsePositiveNumber(openRouterRetryMax, 3));
  const baseDelayMs = parsePositiveNumber(openRouterRetryBaseMs, 800);
  const maxDelayMs = parsePositiveNumber(openRouterRetryMaxMs, 8000);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response: Response;
    let cancelTimeout = () => undefined;
    try {
      const timeout = createTimeoutSignal(openRouterTimeoutMs);
      cancelTimeout = timeout.cancel;
      response = await fetch(`${openRouterBaseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: params.model,
          messages: params.messages,
          temperature: params.temperature,
          max_tokens: params.max_tokens,
        }),
        signal: timeout.signal,
      });
    } catch (error: any) {
      cancelTimeout();
      if (attempt < maxAttempts) {
        const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
        const jittered = delay * (0.5 + Math.random());
        await sleep(jittered);
        continue;
      }
      const isAbort = error?.name === "AbortError";
      const message = isAbort ? "OpenRouter request timed out" : error?.message || "Network error calling AI provider";
      throw new Error(message);
    } finally {
      cancelTimeout();
    }

    const { responseText, payload } = await readResponsePayload(response);

    if (!response.ok) {
      if (attempt < maxAttempts && shouldRetryStatus(response.status)) {
        const retryAfter = response.headers.get("retry-after");
        let delay = baseDelayMs * 2 ** (attempt - 1);
        if (retryAfter) {
          const retrySeconds = Number(retryAfter);
          if (Number.isFinite(retrySeconds) && retrySeconds > 0) {
            delay = retrySeconds * 1000;
          }
        }
        delay = Math.min(maxDelayMs, delay);
        const jittered = delay * (0.5 + Math.random());
        await sleep(jittered);
        continue;
      }
      throw createOpenRouterError(response, payload, responseText);
    }

    if (!payload) {
      throw new Error("Invalid JSON from AI provider");
    }

    const content = payload?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No text generated by AI.");
    }

    return content;
  }

  throw new Error("AI provider retry limit exceeded");
};

export const fetchOpenRouterModels = async () => {
  if (!openRouterKey) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  const headers = buildOpenRouterHeaders();
  let response: Response;
  let cancelTimeout = () => undefined;
  try {
    const timeout = createTimeoutSignal(openRouterTimeoutMs);
    cancelTimeout = timeout.cancel;
    response = await fetch(`${openRouterBaseUrl}/models`, {
      method: "GET",
      headers,
      signal: timeout.signal,
    });
  } catch (error: any) {
    cancelTimeout();
    const isAbort = error?.name === "AbortError";
    const message = isAbort ? "OpenRouter request timed out" : error?.message || "Network error calling AI provider";
    throw new Error(message);
  } finally {
    cancelTimeout();
  }

  const { responseText, payload } = await readResponsePayload(response);
  if (!response.ok) {
    throw createOpenRouterError(response, payload, responseText);
  }
  if (!payload) {
    throw new Error("Invalid JSON from AI provider");
  }
  return payload;
};
