**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Create or update `.env.local` with the required environment variables.
3. Run the app:
   `npm run dev`

## OpenRouter Environment

Required server-only variables (restart the dev server after changes):

- `OPENROUTER_API_KEY`
- `OPENROUTER_REFERER` (recommended: `https://localhost:3000`)
- `OPENROUTER_TITLE` (recommended)

Dev tip: choose a `:free` model slug in `ai_models` when testing to avoid credit issues.

## Common Scripts

- `npm run dev` - start the local dev server
- `npm run build` - build for production
- `npm run start` - run the production build
- `npm run lint` - run lint checks

## Copyright

Copyright (c) 2025 NeuroSyncTeam AI Dynamics PTY LTD. All rights reserved.
