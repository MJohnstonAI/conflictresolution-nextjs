-- Privacy-safe analytics events (no content payloads)

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  metadata jsonb,
  path text,
  created_at timestamp with time zone not null default now()
);

create index if not exists analytics_events_user_id_idx on public.analytics_events(user_id);
create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at);
create index if not exists analytics_events_name_idx on public.analytics_events(event_name);
