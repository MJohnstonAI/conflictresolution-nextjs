export type RouteState = Record<string, unknown>;

const STORAGE_KEY = "cr_route_state";

const readState = (): Record<string, RouteState> => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeState = (state: Record<string, RouteState>) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const setRouteState = (path: string, value: RouteState) => {
  const state = readState();
  state[path] = value;
  writeState(state);
};

export const consumeRouteState = <T extends RouteState>(path: string): T | null => {
  const state = readState();
  const value = state[path] as T | undefined;
  if (!value) return null;
  delete state[path];
  writeState(state);
  return value as T;
};
