# Conflict Resolution

Conflict Resolution is a case-based AI conflict coaching app. It analyzes incoming messages, flags manipulation or legal risk, and drafts responses in four strategic tones.

## Quick start
1. Install dependencies: npm install
2. Copy .env.example to .env.local and fill in required env vars.
3. Run the app: npm run dev

## Local dev notes
- Set NEXT_PUBLIC_SITE_URL=http://localhost:3000
- Set OPENROUTER_REFERER=http://localhost:3000
- Use a :free model slug in ai_models when testing to avoid credit issues.

## OpenRouter environment
Required server-only variables (restart the dev server after changes):
- OPENROUTER_API_KEY
- OPENROUTER_REFERER
- OPENROUTER_TITLE

## Common scripts
- npm run dev - start the local dev server
- npm run build - build for production
- npm run start - run the production build
- npm run lint - run lint checks

## Docs
- docs/product-overview.md
- docs/app-flows.md
- docs/design-reference.md
- docs/vercel-notes.md
- admin_setup.md
- fix_auth.md
- fix_public_access.md
- SEED_TEMPLATES.md
- SQL_UPDATE_CREDITS.md

## Copyright
Copyright (c) 2025 NeuroSyncTeam AI Dynamics PTY LTD. All rights reserved.
