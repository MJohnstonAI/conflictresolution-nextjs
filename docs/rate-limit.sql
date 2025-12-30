-- Shared rate limiting (serverless-safe)

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null,
  reset_at bigint not null,
  updated_at timestamp with time zone not null default now()
);

create or replace function public.rate_limit(
  p_key text,
  p_max integer,
  p_window_ms bigint
)
returns table(allowed boolean, remaining integer, reset_at bigint)
language plpgsql
as $$
declare
  now_ms bigint;
  next_reset bigint;
  current_count integer;
  current_reset bigint;
begin
  now_ms := floor(extract(epoch from now()) * 1000);

  select count, reset_at
    into current_count, current_reset
    from public.rate_limits
    where key = p_key;

  if current_count is null or current_reset <= now_ms then
    next_reset := now_ms + p_window_ms;
    insert into public.rate_limits(key, count, reset_at)
      values (p_key, 1, next_reset)
      on conflict (key)
      do update set count = excluded.count, reset_at = excluded.reset_at, updated_at = now();
    return query select true, greatest(p_max - 1, 0), next_reset;
    return;
  end if;

  if current_count >= p_max then
    return query select false, 0, current_reset;
    return;
  end if;

  update public.rate_limits
    set count = current_count + 1, updated_at = now()
    where key = p_key;

  return query select true, greatest(p_max - (current_count + 1), 0), current_reset;
end;
$$;
