# AI Handover / Migration Protocol

**Project:** Conflict Resolution AI
**Current State:** React SPA (Create-React-App)
**Target State:** Next.js 14 (App Router) + Supabase (SSR)
**Goal:** Migrate fully to a production-ready SaaS architecture with secure API routes and payments.

---

## 1. THE MIGRATION PROMPT
*Copy and paste the text below into Cursor, Windsurf, or ChatGPT-5 to migrate this project.*

```text
Act as a Senior Full-Stack Architect. I have a legacy React SPA that I need to migrate to a production-ready Next.js 14 (App Router) SaaS application.

### 1. PROJECT CONTEXT
**Name:** Conflict Resolution AI
**Description:** A conflict coaching tool where users analyze text disputes using Google Gemini AI.
**Monetization:** 
- "Standard" Plan: $4.99/case (10 rounds).
- "Premium" Plan: Credits based (1 credit = 1 case, 40 rounds).
**Current Stack:** React, Tailwind CSS, LocalStorage (Legacy), Supabase (Auth only).
**Target Stack:** Next.js 14, Tailwind, Supabase (Auth + DB + RLS), Stripe/PayPal Webhooks.

### 2. CORE MIGRATION TASKS
Please initialize a new Next.js app and migrate the logic as follows:

**A. Architecture & Routing**
- Convert `react-router-dom` to Next.js App Router (`app/`).
- Create the following route structure:
  - `app/page.tsx` (Landing Page)
  - `app/auth/page.tsx` (Login/Signup - Use Supabase SSR Auth)
  - `app/vault/page.tsx` (Dashboard - Fetch cases server-side)
  - `app/case/[id]/page.tsx` (The War Room - Client Component)
  - `app/api/analyze/route.ts` (Move AI logic here to hide API keys)

**B. Data Layer (Supabase)**
- Replace `services/store.ts` (LocalStorage) with direct Supabase calls.
- Implement Row Level Security (RLS) policies (I have the schema).
- Use `lib/supabase/server.ts` for server components and `lib/supabase/client.ts` for client components.

**C. The "War Room" (Critical Logic)**
- Port the `views/WarRoom.tsx` logic exactly.
- It must handle:
  - Multi-round chat history.
  - "Sender Identity" inputs.
  - 4 Response Modes (Peacekeeper, Barrister, Grey Rock, Nuclear).
  - Premium logic (Deep Thinking toggle).
  - "Case Closed" state (Round limits).

**D. Design System**
- Preserve the "Navy & Gold" theme.
- Use the following Tailwind colors:
  - Navy: #020617 (950), #0f172a (900), #1e293b (800)
  - Gold: #f59e0b (500)
  - Action Blue: #2563eb (Light Mode) / #1e293b (Dark Mode)
- Support Light/Dark/System themes via `next-themes` or CSS variables.

### 3. DATABASE SCHEMA
Use this SQL to setup the backend:

```sql
-- PROFILES
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  premium_credits int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.profiles enable row level security;
create policy "Self View" on profiles for select using (auth.uid() = id);

-- CASES
create table public.cases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  opponent_type text not null,
  plan_type text not null check (plan_type in ('standard', 'premium', 'demo')),
  rounds_limit int not null,
  rounds_used int default 0,
  is_closed boolean default false,
  note text,
  demo_scenario_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.cases enable row level security;
create policy "Self CRUD" on cases for all using (auth.uid() = user_id);

-- ROUNDS
create table public.rounds (
  id uuid default gen_random_uuid() primary key,
  case_id uuid references public.cases(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  round_number int not null,
  opponent_text text,
  sender_identity text,
  analysis_data jsonb, -- Stores vibeCheck, scores, responses
  selected_mode text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.rounds enable row level security;
create policy "Self CRUD" on rounds for all using (auth.uid() = user_id);

-- TEMPLATES
create table public.templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid, -- Nullable, no FK needed for system templates
  title text not null,
  content text not null,
  mode text not null,
  opponent_type text not null,
  is_public boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.templates enable row level security;
-- Allow ALL users (public) to view templates
CREATE POLICY "Public Read Templates" ON public.templates FOR SELECT USING (true);

-- SUCCESS STORIES
create table public.success_stories (
  id uuid default gen_random_uuid() primary key,
  author text not null,
  role text not null,
  text text not null,
  stars int default 5,
  is_featured boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.success_stories enable row level security;
-- Allow ALL users (public) to view stories
CREATE POLICY "Public Read Stories" ON public.success_stories FOR SELECT USING (true);
```

### 4. PAYMENT INTEGRATION (PayPal/Peach)
- Create an API route `app/api/webhooks/payment/route.ts`.
- When a payment succeeds, strictly increment `premium_credits` in the `profiles` table.

Please begin by scaffolding the Next.js project structure.
```

---

## 2. API KEYS REQUIRED
*You will need to provide these to the AI or `.env` file.*

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_API_KEY=your_gemini_key
```

---

## 3. ASSETS TO MIGRATE
*   **Icons:** Ensure `lucide-react` is installed.
*   **Compression:** `lz-string` is no longer needed (Supabase replaces it).
*   **Fonts:** Use `next/font` with Inter and Playfair Display.