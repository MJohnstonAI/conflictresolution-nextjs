---
# Definition of Done (Ship Checklist)

- No secrets leaked to client (OPENROUTER_API_KEY, SUPABASE_SERVICE_ROLE_KEY).
- Demo mode makes zero AI network calls.
- Server routes enforce caps (max_tokens + input truncation policies).
- Happy-path smoke test: New Case → War Room generate → copy draft → save round → view in Vault.
- Errors are user-friendly (timeouts, 429/503, invalid session).
- Basic a11y: keyboard focus visible, buttons labeled, no major contrast issues.
- Performance sanity: no obvious waterfalls; large pasted text handled gracefully.
---
