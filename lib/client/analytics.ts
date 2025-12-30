type AnalyticsPayload = {
  name: string;
  metadata?: Record<string, unknown>;
  path?: string;
  ts?: number;
};

const sanitizePath = (path: string) => {
  if (!path) return "/";
  if (path.startsWith("/case/")) return "/case/:id";
  return path;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

export const trackEvent = async (name: string, metadata: Record<string, unknown> = {}) => {
  if (typeof window === "undefined") return;
  if (!name) return;
  const payload: AnalyticsPayload = {
    name,
    metadata: isRecord(metadata) ? metadata : {},
    path: sanitizePath(window.location.pathname),
    ts: Date.now(),
  };

  const anyWindow = window as any;
  if (!anyWindow.__crEvents) anyWindow.__crEvents = [];
  anyWindow.__crEvents.push(payload);

  try {
    const body = JSON.stringify(payload);
    if (typeof navigator?.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics", blob);
      return;
    }
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Analytics event failed:", error);
    }
  }
};
