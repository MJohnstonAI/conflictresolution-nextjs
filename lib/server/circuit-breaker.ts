type CircuitState = {
  failureCount: number;
  lastFailureAt: number;
  openUntil: number;
};

const getStore = (): Map<string, CircuitState> => {
  const g = globalThis as typeof globalThis & {
    __crCircuitStore?: Map<string, CircuitState>;
  };
  if (!g.__crCircuitStore) {
    g.__crCircuitStore = new Map<string, CircuitState>();
  }
  return g.__crCircuitStore;
};

const getConfig = () => {
  const threshold = Number(process.env.CIRCUIT_BREAKER_THRESHOLD || 5);
  const windowMs = Number(process.env.CIRCUIT_BREAKER_WINDOW_MS || 60_000);
  const openMs = Number(process.env.CIRCUIT_BREAKER_OPEN_MS || 60_000);
  return {
    threshold: Number.isFinite(threshold) && threshold > 0 ? threshold : 5,
    windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 60_000,
    openMs: Number.isFinite(openMs) && openMs > 0 ? openMs : 60_000,
  };
};

export const checkCircuit = (key: string) => {
  const store = getStore();
  const state = store.get(key);
  const now = Date.now();
  if (!state) return { open: false, retryAfterMs: 0 };
  if (state.openUntil > now) {
    return { open: true, retryAfterMs: state.openUntil - now };
  }
  return { open: false, retryAfterMs: 0 };
};

export const recordCircuitFailure = (key: string) => {
  const store = getStore();
  const now = Date.now();
  const config = getConfig();
  const state = store.get(key);

  if (!state || now - state.lastFailureAt > config.windowMs) {
    const nextState: CircuitState = { failureCount: 1, lastFailureAt: now, openUntil: 0 };
    store.set(key, nextState);
    return nextState;
  }

  const failureCount = state.failureCount + 1;
  const openUntil = failureCount >= config.threshold ? now + config.openMs : 0;
  const nextState: CircuitState = { failureCount, lastFailureAt: now, openUntil };
  store.set(key, nextState);
  return nextState;
};

export const recordCircuitSuccess = (key: string) => {
  const store = getStore();
  if (store.has(key)) {
    store.delete(key);
  }
};
