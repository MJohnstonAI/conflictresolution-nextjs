---
# Backlog

## Done
- Fix War Room opponent message cap (15,000 chars) with counter + near-limit guidance.
- Auto-summarize pasted adversary messages over 15,000 chars via `/api/message-summarize` (premium model) instead of hard truncation.
- Add "Case Closed" panel with export actions and "Start Part 2" summary handoff.
- Add missing `animate-shake` animation used in Auth error UI.
- Add basic in-memory rate limiting to `/api/analyze` and `/api/context-summarize`.
- Add accessibility improvements (aria-labels + focus-visible rings) for key icon buttons/modals.
- Add route-level metadata for primary routes (Vault, Templates, Help, Demo, Auth, War Room, Credits store).
- Audit UI copy for garbled characters; no remaining mojibake found in user-facing strings.
- Add server-side caps for `historyText` and identity strings in `/api/analyze` to protect prompt budget.
- Add auth-required guard behind `REQUIRE_AUTH_FOR_AI` flag + demo AI hard-blocks in AI routes.
- Add retry UX for transient/429 analysis failures in War Room.
- Add server-side case access enforcement behind `ENFORCE_AI_CASE_ACCESS` with plan-type validation.
- Add optional server-side context/history summarization in `/api/analyze` behind `ENABLE_ANALYZE_CONTEXT_SUMMARY`.
- Add `/api/models` TTL caching to reduce upstream fetch churn.
- Add Refine Response UI that calls `/api/revise` and updates selected draft.
- Add post-demo conversion CTA when demo completes.

## Next
- Add a small "Refine Response" flow in War Room using `/api/revise` (optional).
- Add lightweight caching for `/api/models` calls to reduce fetch churn.

## Ideas
- Track per-round token usage/cost estimates (admin-only).
- Streaming AI responses for improved perceived latency.
---
