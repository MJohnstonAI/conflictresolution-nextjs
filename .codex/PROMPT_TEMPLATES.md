---
# Prompt Templates (Copy/Paste)

## 1) Builder Pass (No Code)
Read this repository as source of truth. Do not change code yet.

1) Summarize the current implemented user journey:
   - Start New Case → War Room rounds → Vault → Demo Mode.
2) Identify gaps/issues/opportunities in:
   UX, conversion, performance, accessibility, SEO, security/privacy, reliability, cost control, DX.
3) Provide 15 suggestions grouped:
   Quick Wins / Medium / Larger Bets.
4) Rank each: Impact(1–5), Effort(1–5), Risk(L/M/H).
5) For each suggestion, write a "Paste-into-Codex Prompt" that would implement it.
6) Recommend Top 3 next with reasoning.

## 2) Ship One Suggestion
Implement suggestion #[N]: "[TITLE]".

Rules:
- No redesign; keep existing layout and flow.
- Server-only secrets; do not touch env patterns except to improve safety.
- Demo mode must remain no-AI.
- Small patch; avoid refactors unless required.
- Update BACKLOG.md (Done/Next/Ideas).
- Provide patch-style code grouped by filename.
- End with How to Test checklist.

## 3) Regression Fix Mode
You introduced a regression: [describe].

Do:
1) Explain likely cause.
2) Provide smallest patch to fix it.
3) Add a test or guard to prevent recurrence.
4) Update BACKLOG.md.
---
