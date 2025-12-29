-- Sessions monetization migration
-- This script adds session balances + ledger, then migrates remaining rounds/credits to sessions.

create extension if not exists pgcrypto;

-- 1) Add session balance columns
alter table public.profiles
  add column if not exists standard_sessions integer not null default 0,
  add column if not exists premium_sessions integer not null default 0;

-- 2) Ledger for auditing session usage
create table if not exists public.session_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid references public.cases(id) on delete set null,
  round_id uuid references public.rounds(id) on delete set null,
  plan_type text not null check (plan_type in ('standard', 'premium')),
  delta integer not null,
  reason text,
  created_at timestamp with time zone not null default now()
);

create index if not exists session_events_user_id_idx on public.session_events(user_id);
create index if not exists session_events_case_id_idx on public.session_events(case_id);

-- 3) Atomic consume/refund helpers
create or replace function public.consume_session(
  p_user_id uuid,
  p_plan_type text,
  p_case_id uuid default null,
  p_round_id uuid default null,
  p_reason text default null
)
returns table(consumed boolean, remaining integer)
language plpgsql
as $$
declare
  updated_remaining integer;
  safe_round_id uuid;
begin
  if p_plan_type not in ('standard', 'premium') then
    return query select false, null;
    return;
  end if;

  if p_plan_type = 'standard' then
    update public.profiles
      set standard_sessions = standard_sessions - 1
      where id = p_user_id and standard_sessions > 0
      returning standard_sessions into updated_remaining;
  else
    update public.profiles
      set premium_sessions = premium_sessions - 1
      where id = p_user_id and premium_sessions > 0
      returning premium_sessions into updated_remaining;
  end if;

  if updated_remaining is null then
    if p_plan_type = 'standard' then
      select standard_sessions into updated_remaining from public.profiles where id = p_user_id;
    else
      select premium_sessions into updated_remaining from public.profiles where id = p_user_id;
    end if;
    return query select false, coalesce(updated_remaining, 0);
    return;
  end if;

  safe_round_id := p_round_id;
  if safe_round_id is not null then
    perform 1 from public.rounds where id = safe_round_id;
    if not found then
      safe_round_id := null;
    end if;
  end if;

  insert into public.session_events(user_id, case_id, round_id, plan_type, delta, reason)
  values (p_user_id, p_case_id, safe_round_id, p_plan_type, -1, p_reason);

  return query select true, updated_remaining;
end;
$$;

create or replace function public.refund_session(
  p_user_id uuid,
  p_plan_type text,
  p_case_id uuid default null,
  p_round_id uuid default null,
  p_reason text default null
)
returns void
language plpgsql
as $$
declare
  safe_round_id uuid;
begin
  safe_round_id := p_round_id;
  if safe_round_id is not null then
    perform 1 from public.rounds where id = safe_round_id;
    if not found then
      safe_round_id := null;
    end if;
  end if;
  if p_plan_type not in ('standard', 'premium') then
    return;
  end if;

  if p_plan_type = 'standard' then
    update public.profiles
      set standard_sessions = standard_sessions + 1
      where id = p_user_id;
  else
    update public.profiles
      set premium_sessions = premium_sessions + 1
      where id = p_user_id;
  end if;

  insert into public.session_events(user_id, case_id, round_id, plan_type, delta, reason)
  values (p_user_id, p_case_id, safe_round_id, p_plan_type, 1, p_reason);
end;
$$;

-- 4) One-time migration: map remaining rounds + unused credits to sessions
-- Standard: 10 Sessions per prior Standard Case
-- Premium: 40 Sessions per prior Premium Case
with case_balances as (
  select
    user_id,
    sum(case when plan_type = 'standard' then greatest(coalesce(rounds_limit, 0) - coalesce(rounds_used, 0), 0) else 0 end) as standard_remaining,
    sum(case when plan_type = 'premium' then greatest(coalesce(rounds_limit, 0) - coalesce(rounds_used, 0), 0) else 0 end) as premium_remaining
  from public.cases
  where plan_type in ('standard', 'premium')
  group by user_id
)
update public.profiles p
set
  standard_sessions = standard_sessions + coalesce(cb.standard_remaining, 0),
  premium_sessions = premium_sessions + coalesce(cb.premium_remaining, 0)
from case_balances cb
where p.id = cb.user_id;

update public.profiles
set
  standard_sessions = standard_sessions + coalesce(standard_credits, 0) * 10,
  premium_sessions = premium_sessions + coalesce(premium_credits, 0) * 40;
