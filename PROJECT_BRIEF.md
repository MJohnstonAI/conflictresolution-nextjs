---
# Conflict Resolution — Project Brief

## Summary
Conflict Resolution is a Next.js web application that helps users navigate interpersonal and professional disputes by:
- capturing a dispute “case” (context + adversary messages),
- generating structured analysis and multiple response drafts (Peacekeeper, Barrister, Grey Rock, Nuclear),
- saving case history to a Vault for follow-up and export.

The product uses Supabase for auth + persistence and OpenRouter for LLM access (server-side only).

## Product Goals
- Help users respond effectively under emotional pressure with clear, strategic drafts.
- Keep the UX fast and approachable (guided flows, strong defaults, minimal friction).
- Make AI usage cost-controlled (token caps, model selection, truncation/summarization).
- Support a compelling demo experience without incurring AI costs.

## Target Users
- Individuals handling relationship/family/friend conflicts.
- Professionals handling workplace/client/landlord disputes.
- Power users who want “case files” and repeatable templates.

## Core User Flows
### 1) Start New Case
- User selects an adversary type and writes a case note (“Describe the Conflict Case”).
- Standard vs Premium case selection happens at case creation.
- Case note is limited to **40,000 characters** (with auto-summarization when pasting over the limit).

### 2) War Room (Case Playback + Response Generation)
- User provides the adversary’s latest message.
- App generates:
  - vibe check + tactical summary
  - fallacy/tactic detection
  - risk assessment
  - 4 response drafts (tone modes)
- User chooses a tone and copies the draft.
- The case progresses round-by-round until the plan’s round limit is reached.

### 3) Vault
- Saved cases and their rounds are accessible for review and export.

### 4) Demo Mode (No AI Calls)
- Demo scenarios are pre-scripted (like a recording): the user “plays” rounds sequentially.
- The app renders the same War Room UI, but does not call the AI provider.

## Key Features
- Auth: Supabase email/password, OTP (magic link), and Google OAuth.
- Case system: Cases, rounds, and saved analysis.
- Modes: Peacekeeper (default), Barrister, Grey Rock, Nuclear.
- Admin model controls: admins can set the Standard/Premium OpenRouter model slugs.
- Cost safety:
  - server-side truncation of adversary message input
  - server-side cap of case context
  - optional context summarization endpoint used by the Home paste-overflow path

## Tech Stack
- Frontend: Next.js 15 (App Router), React 18, Tailwind CSS, lucide-react icons.
- Backend/API: Next.js route handlers (`app/api/*`) with Node runtime.
- Auth/DB: Supabase.
- LLM: OpenRouter (server-side calls only).

## High-Level Architecture
- Client UI (views/*, components/*) calls Next.js API routes for AI operations.
- Next.js API routes call OpenRouter using a server-only API key.
- Model selection is resolved on the server via Supabase (`ai_models` + optional per-profile override ids.

Data flow (analyze):
1. Client (`services/ai.ts`) POSTs to `/api/analyze`.
2. Server resolves the effective model slug (standard/premium).
3. Server sends a `chat/completions` request to OpenRouter.
4. Server parses and returns structured analysis JSON.
5. Client persists the round to Supabase (or local fallback in demo/guest paths).

## Persistence Model (Supabase)
- `profiles`: user identity + credits + admin flags + preferred theme + model override ids.
- `cases`: case metadata and user-provided case note.
- `rounds`: per-round adversary text and AI analysis payload.
- `ai_models`: catalog mapping `plan_type -> model_slug` (and stable IDs for references).

## AI / OpenRouter Integration
- Primary server helper: `lib/server/openrouter.ts`.
- Main AI routes:
  - `/api/analyze`: structured analysis + 4 drafts.
  - `/api/revise`: rewrite a draft to satisfy an instruction.
  - `/api/summarize`: generate a case summary.
  - `/api/models`: list OpenRouter models (admin reference).
  - `/api/admin/models`: read/write configured standard/premium model slugs (admin only).
  - `/api/context-summarize`: summarize pasted case context when it exceeds limits.

### Token / Output Controls (current)
- Requests use `max_tokens` to cap completion output.
- Premium “deep thinking” is implemented as a larger `max_tokens` cap (not a provider-native reasoning budget).

## Demo Experience Design
- Demo scenarios are authored in `services/demo_scenarios.ts`.
- Demo mode creates a case with `planType: demo` and a `demoScenarioId`.
- War Room uses the script to append rounds, disables user edits, and reveals adversary raw text by default.

## Security & Privacy Notes
- OpenRouter key is server-only; clients never see it.
- Supabase service role is server-only and used for privileged reads/writes (e.g., model resolution).
- Case notes and adversary messages can contain sensitive data; treat as private user content.

## Configuration
See `README.md` and `docs/vercel-notes.md`.

Required env vars:
- Public:
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server-only:
  - `OPENROUTER_API_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENROUTER_REFERER` (recommended)
  - `OPENROUTER_TITLE` (recommended)

## Operational Considerations
- Cost control: model choice + token caps + aggressive truncation/summarization.
- Reliability: OpenRouter retries and timeouts are configured via env vars.
- Admin tooling: model selection UI and model list reference view in Settings.

## Roadmap (Suggested)
- Better server-side caps for all prompt inputs (history/context) with explicit truncation policies.
- Optional streaming for generation and improved perceived latency.
- More demo scenarios and richer “recording” playback (timing, narration, progress cues).
- Analytics for conversion from demo to paid.

---
Last updated: 2025-12-27
---
