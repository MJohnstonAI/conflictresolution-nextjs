---
# Decisions (Do Not Re-litigate Without Explicit Instruction)

- Framework: Next.js 15 App Router, React 18, Tailwind, lucide-react.
- Auth/DB: Supabase (email/password, OTP magic link, Google OAuth).
- LLM: OpenRouter via Next.js route handlers (server-only key).
- Model resolution: server resolves standard/premium from Supabase ai_models (+ optional profile override).
- Demo mode: scripted playback in services/demo_scenarios.ts; NEVER calls OpenRouter.
- Cost safety: server truncation/caps + optional context summarization for paste overflow.
- UX: guided flows, strong defaults, minimal friction; avoid redesign unless requested.
---
