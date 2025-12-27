export type ApiErrorDetails = {
  message: string;
  code?: string;
  upstreamStatus?: number;
  requestId?: string | null;
};

const readString = (value: unknown) => (typeof value === "string" ? value : "");
const readCode = (value: unknown) => {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
};
const readNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

export const readApiErrorDetails = async (response: Response): Promise<ApiErrorDetails> => {
  const text = await response.text();
  let payload: any = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  let message = "";
  let code: string | undefined;
  let upstreamStatus: number | undefined;
  let requestId: string | null | undefined;

  if (payload?.error && typeof payload.error === "object") {
    message = readString(payload.error.message);
    code = readCode(payload.error.code) || undefined;
    upstreamStatus = readNumber(payload.error.upstreamStatus);
    requestId = readString(payload.error.requestId) || undefined;
  } else if (typeof payload?.error === "string") {
    message = payload.error;
    if (typeof payload?.details === "string" && payload.details.trim()) {
      message = `${message}: ${payload.details}`;
    }
  } else if (typeof payload?.message === "string") {
    message = payload.message;
  }

  if (!message) {
    message = text || "Request failed.";
  }

  return { message, code, upstreamStatus, requestId };
};

export const formatApiErrorMessage = (details: ApiErrorDetails, fallbackStatus?: number) => {
  const status = details.upstreamStatus ?? fallbackStatus ?? "unknown";
  const codePart = details.code ? ` (${details.code})` : "";
  const base = details.message || "Request failed.";
  let formatted = `Error ${status}${codePart}: ${base}`;
  if (details.requestId) {
    formatted = `${formatted} Request ID: ${details.requestId}`;
  }
  return formatted;
};
