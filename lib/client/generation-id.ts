type GenerationState = {
  key: string;
  id: string;
  inputHash: string;
  createdAt: number;
};

const STORAGE_KEY = "cr_generation_id_v1";
const TTL_MS = 30 * 60 * 1000;

const hashString = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
};

const buildKey = (caseId: string, roundId: string | null, isRerun: boolean) =>
  `${caseId}:${roundId || "new"}:${isRerun ? "rerun" : "new"}`;

const readState = (): GenerationState | null => {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GenerationState;
  } catch {
    return null;
  }
};

const writeState = (state: GenerationState) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const getOrCreateGenerationId = (params: {
  caseId: string;
  roundId: string | null;
  isRerun: boolean;
  inputText: string;
}) => {
  if (typeof window === "undefined") return crypto.randomUUID();
  const key = buildKey(params.caseId, params.roundId, params.isRerun);
  const inputHash = hashString(params.inputText || "");
  const existing = readState();
  const now = Date.now();

  if (
    existing &&
    existing.key === key &&
    existing.inputHash === inputHash &&
    now - existing.createdAt < TTL_MS
  ) {
    return existing.id;
  }

  const id = crypto.randomUUID();
  writeState({ key, id, inputHash, createdAt: now });
  return id;
};

export const clearGenerationId = (params?: {
  caseId: string;
  roundId: string | null;
  isRerun: boolean;
}) => {
  if (typeof window === "undefined") return;
  if (!params) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  const existing = readState();
  const key = buildKey(params.caseId, params.roundId, params.isRerun);
  if (existing?.key === key) {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
};
