-- AI model catalog (tiny, two rows)
create table if not exists public.ai_models (
  id bigint primary key,
  plan_type text not null check (plan_type in ('standard', 'premium')),
  model_slug text not null,
  updated_at timestamptz not null default now()
);

-- Seed defaults (use stable IDs for referential integrity)
insert into public.ai_models (id, plan_type, model_slug)
values
  (1, 'standard', 'anthropic/claude-3-haiku'),
  (2, 'premium', 'anthropic/claude-sonnet-4.5')
on conflict (id) do update
set plan_type = excluded.plan_type,
    model_slug = excluded.model_slug,
    updated_at = now();

-- Link profiles to models by ID (no model names stored in profiles)
alter table public.profiles
  add column if not exists standard_model_id bigint references public.ai_models(id),
  add column if not exists premium_model_id bigint references public.ai_models(id);

update public.profiles
set standard_model_id = 1
where standard_model_id is null;

update public.profiles
set premium_model_id = 2
where premium_model_id is null;

-- Lock down by default (service role bypasses RLS)
alter table public.ai_models enable row level security;
