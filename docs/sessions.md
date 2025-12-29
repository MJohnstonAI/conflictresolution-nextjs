# Sessions Monetization

## Overview
- Cases and rounds are unlimited. Session balance is the only metered unit.
- Standard includes 10 Sessions per billing period.
- Premium includes 40 Sessions per billing period.
- 1 Session generates strategy + mediation-style guidance + draft responses for one round.

## When Sessions Are Consumed
- Only when a user triggers generation (Run Session / Re-run Session).
- Browsing history, loading Vault, editing context, and editing evidence do not consume Sessions.
- Re-running analysis consumes 1 Session and overwrites the round output.

## Server Enforcement
- `/app/api/analyze/route.ts` consumes 1 Session before calling the model.
- If the model call fails after consumption, the Session is refunded.
- Consumption is atomic via `consume_session` RPC and logged to `session_events`.

## Migration
- Run `docs/sessions-migration.sql` once to add session balances and migrate existing data.
- Standard credits map to 10 Sessions each; Premium credits map to 40 Sessions each.
- Remaining rounds in existing cases are converted into Sessions.

## UI Notes
- "Credits" language is replaced with "Sessions".
- Session balance is visible in the sidebar wallet and in the Sessions Store.
