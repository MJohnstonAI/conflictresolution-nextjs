-- Session billing migration
-- Adds session balances + ledger tables/functions for session-based billing.
-- WARNING: Clean slate section removes existing session ledger data.

-- 0) Clean slate: drop ledger functions + table to avoid drift from prior migrations.
DROP FUNCTION IF EXISTS public.consume_session(uuid, text, uuid, uuid, text);
DROP FUNCTION IF EXISTS public.consume_session(uuid, text, uuid, uuid, uuid, text);
DROP FUNCTION IF EXISTS public.refund_session(uuid, text, uuid, uuid, text);
DROP FUNCTION IF EXISTS public.refund_session(uuid, text, uuid, uuid, uuid, text);
DROP FUNCTION IF EXISTS public.grant_sessions(uuid, text, integer, text);
DROP TABLE IF EXISTS public.session_events CASCADE;

-- 1) Ensure session balances exist on profiles.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS standard_sessions integer DEFAULT 0;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS premium_sessions integer DEFAULT 0;

UPDATE public.profiles SET standard_sessions = 0 WHERE standard_sessions IS NULL;
UPDATE public.profiles SET premium_sessions = 0 WHERE premium_sessions IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN standard_sessions SET DEFAULT 0;
ALTER TABLE public.profiles
  ALTER COLUMN premium_sessions SET DEFAULT 0;

-- 2) Session ledger table.
CREATE TABLE IF NOT EXISTS public.session_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  round_id uuid REFERENCES public.rounds(id) ON DELETE SET NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('standard', 'premium')),
  delta integer NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  generation_id uuid
);

CREATE INDEX IF NOT EXISTS session_events_user_id_idx
  ON public.session_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS session_events_case_id_idx
  ON public.session_events (case_id);
CREATE INDEX IF NOT EXISTS session_events_generation_id_idx
  ON public.session_events (user_id, generation_id);
CREATE UNIQUE INDEX IF NOT EXISTS session_events_generation_delta_uidx
  ON public.session_events (user_id, generation_id, delta)
  WHERE generation_id IS NOT NULL;

ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Session Events Self Read"
  ON public.session_events
  FOR SELECT
  USING (auth.uid() = user_id);

GRANT SELECT ON public.session_events TO authenticated;
GRANT ALL ON public.session_events TO service_role;

-- 3) Consume session (used by /api/analyze).
CREATE OR REPLACE FUNCTION public.consume_session(
  p_user_id uuid,
  p_plan_type text,
  p_case_id uuid DEFAULT NULL,
  p_round_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL
) RETURNS TABLE(consumed boolean, remaining integer)
LANGUAGE plpgsql
AS $$
DECLARE
  updated_remaining integer;
  safe_round_id uuid;
BEGIN
  IF p_plan_type NOT IN ('standard', 'premium') THEN
    RETURN QUERY SELECT false, NULL;
    RETURN;
  END IF;

  IF p_plan_type = 'standard' THEN
    UPDATE public.profiles
      SET standard_sessions = standard_sessions - 1
      WHERE id = p_user_id AND standard_sessions > 0
      RETURNING standard_sessions INTO updated_remaining;
  ELSE
    UPDATE public.profiles
      SET premium_sessions = premium_sessions - 1
      WHERE id = p_user_id AND premium_sessions > 0
      RETURNING premium_sessions INTO updated_remaining;
  END IF;

  IF updated_remaining IS NULL THEN
    IF p_plan_type = 'standard' THEN
      SELECT standard_sessions INTO updated_remaining FROM public.profiles WHERE id = p_user_id;
    ELSE
      SELECT premium_sessions INTO updated_remaining FROM public.profiles WHERE id = p_user_id;
    END IF;
    RETURN QUERY SELECT false, COALESCE(updated_remaining, 0);
    RETURN;
  END IF;

  safe_round_id := p_round_id;
  IF safe_round_id IS NOT NULL THEN
    PERFORM 1 FROM public.rounds WHERE id = safe_round_id;
    IF NOT FOUND THEN
      safe_round_id := NULL;
    END IF;
  END IF;

  INSERT INTO public.session_events(user_id, case_id, round_id, plan_type, delta, reason)
  VALUES (p_user_id, p_case_id, safe_round_id, p_plan_type, -1, p_reason);

  RETURN QUERY SELECT true, updated_remaining;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_session(uuid, text, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_session(uuid, text, uuid, uuid, text) TO service_role;

-- 4) Refund session (optional, used on failures).
CREATE OR REPLACE FUNCTION public.refund_session(
  p_user_id uuid,
  p_plan_type text,
  p_case_id uuid DEFAULT NULL,
  p_round_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  safe_round_id uuid;
BEGIN
  safe_round_id := p_round_id;
  IF safe_round_id IS NOT NULL THEN
    PERFORM 1 FROM public.rounds WHERE id = safe_round_id;
    IF NOT FOUND THEN
      safe_round_id := NULL;
    END IF;
  END IF;
  IF p_plan_type NOT IN ('standard', 'premium') THEN
    RETURN;
  END IF;

  IF p_plan_type = 'standard' THEN
    UPDATE public.profiles
      SET standard_sessions = standard_sessions + 1
      WHERE id = p_user_id;
  ELSE
    UPDATE public.profiles
      SET premium_sessions = premium_sessions + 1
      WHERE id = p_user_id;
  END IF;

  INSERT INTO public.session_events(user_id, case_id, round_id, plan_type, delta, reason)
  VALUES (p_user_id, p_case_id, safe_round_id, p_plan_type, 1, p_reason);
END;
$$;

GRANT EXECUTE ON FUNCTION public.refund_session(uuid, text, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_session(uuid, text, uuid, uuid, text) TO service_role;

-- 5) Grant sessions (used by purchases).
CREATE OR REPLACE FUNCTION public.grant_sessions(
  p_user_id uuid,
  p_plan_type text,
  p_delta integer,
  p_reason text DEFAULT 'purchase'
) RETURNS TABLE(remaining integer)
LANGUAGE plpgsql
AS $$
DECLARE
  updated_remaining integer;
BEGIN
  IF p_plan_type NOT IN ('standard', 'premium') THEN
    RAISE EXCEPTION 'Invalid plan type';
  END IF;
  IF p_delta IS NULL OR p_delta <= 0 THEN
    RAISE EXCEPTION 'Delta must be positive';
  END IF;

  IF p_plan_type = 'standard' THEN
    UPDATE public.profiles
      SET standard_sessions = standard_sessions + p_delta
      WHERE id = p_user_id
      RETURNING standard_sessions INTO updated_remaining;
  ELSE
    UPDATE public.profiles
      SET premium_sessions = premium_sessions + p_delta
      WHERE id = p_user_id
      RETURNING premium_sessions INTO updated_remaining;
  END IF;

  IF updated_remaining IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO public.session_events(user_id, plan_type, delta, reason)
  VALUES (p_user_id, p_plan_type, p_delta, p_reason);

  RETURN QUERY SELECT updated_remaining;
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_sessions(uuid, text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_sessions(uuid, text, integer, text) TO service_role;
