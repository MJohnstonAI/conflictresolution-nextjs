# Migration Report

## Overview
- Migrated the SPA routes to Next.js App Router with a shared layout shell and route-aligned pages.
- Preserved the original UI structure, layout, and interaction patterns from the SPA.
- Moved AI calls to server-only Next.js route handlers to keep secrets off the client.

## Routes and Components Migrated
- Routes: `/`, `/auth`, `/demo`, `/vault`, `/templates`, `/testimonials`, `/help`, `/unlock/credits`, `/case/[id]`
- Layout shell: sidebar + mobile bottom nav + settings modal
- Views: Auth, DemoSelect, Help, Templates, Testimonials, UnlockCase, Vault, WarRoom, Home
- Services: auth redirect updates, AI fetches via `/api/*`, Supabase env guards

## Parity Checklist Status
- Pages/routes: PASS (paths match SPA routes without hash)
- Navigation/links/buttons: PASS (router actions mapped to Next)
- Typography: PASS (Inter + Playfair Display weights aligned)
- Colors and spacing tokens: PASS (CSS variables mirrored)
- Modals and overlays: PASS (same DOM structure/classes)
- Animations: PARTIAL (fade-in preserved; `animate-shake` still undefined as in SPA)
- Images/domains: PASS (remote icon domain configured)
- Forms/inputs/combobox: PASS (component structure unchanged)
- Data flows: PASS (same services, now proxied through server routes for AI)

## Assumptions
- Supabase credentials and Gemini API key are not known; placeholders added to `.env.example`.
- Supabase anon key and URL must be set in Vercel env vars for live data.
- AI routes require `API_KEY` server env variable.
- Template prefill state is stored in sessionStorage to mimic SPA navigation state.

## Intentional Upgrades
- None.

## Vercel Readiness Checklist
- Node pin present: `.nvmrc`
- Lint/build scripts: present in `package.json`
- `next lint`: PASS
- `next build`: PASS (warns if Supabase env vars are missing)
- Env vars documented: `docs/vercel-notes.md`
- `.env.example` present
- `next/image` remotePatterns: `cdn-icons-png.flaticon.com` in `next.config.js`
- Dynamic rendering: `/case/[id]` is dynamic; API routes are server-only

## Notes
- Legacy SPA entry points and Vite config removed (`App.tsx`, `index.html`, `index.tsx`, `vite.config.ts`).
- Legacy `/api` functions removed in favor of `app/api/*` route handlers.
- `public/manifest.json`, `public/robots.txt`, and `public/sitemap.xml` served from `public/`.
