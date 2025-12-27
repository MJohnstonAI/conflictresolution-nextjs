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

## Next
- Add a small "Refine Response" flow in War Room using `/api/revise` (optional).
- Add lightweight caching for `/api/models` calls to reduce fetch churn.

## Ideas
- Track per-round token usage/cost estimates (admin-only).
- Streaming AI responses for improved perceived latency.
---
