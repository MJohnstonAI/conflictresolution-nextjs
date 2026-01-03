-- Viral scale reliability migration (idempotent).

-- 1) Cases: track last activity timestamp for fast Vault sorting.
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz;

UPDATE public.cases
SET last_activity_at = COALESCE(last_activity_at, created_at);

UPDATE public.cases AS c
SET last_activity_at = r.latest_created_at
FROM (
  SELECT case_id, MAX(created_at) AS latest_created_at
  FROM public.rounds
  GROUP BY case_id
) AS r
WHERE c.id = r.case_id
  AND (c.last_activity_at IS NULL OR c.last_activity_at < r.latest_created_at);

ALTER TABLE public.cases
  ALTER COLUMN last_activity_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS cases_user_last_activity_idx
  ON public.cases (user_id, last_activity_at DESC);

CREATE INDEX IF NOT EXISTS rounds_case_created_at_idx
  ON public.rounds (case_id, created_at DESC);

-- 2) Session events: ensure generation_id exists + index for idempotency.
ALTER TABLE public.session_events
  ADD COLUMN IF NOT EXISTS generation_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS session_events_generation_delta_uidx
  ON public.session_events (user_id, generation_id, delta)
  WHERE (generation_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS session_events_user_created_at_idx
  ON public.session_events (user_id, created_at DESC);

-- 3) Trigger to keep last_activity_at fresh when rounds are created.
CREATE OR REPLACE FUNCTION public.touch_case_last_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.cases
    SET last_activity_at = NEW.created_at
    WHERE id = NEW.case_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rounds_touch_case_activity ON public.rounds;
CREATE TRIGGER rounds_touch_case_activity
  AFTER INSERT ON public.rounds
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_case_last_activity();

-- 4) Session consumption idempotency: generation_id support.
DROP FUNCTION IF EXISTS public.consume_session(uuid, text, uuid, uuid, text);
CREATE OR REPLACE FUNCTION public.consume_session(
  p_user_id uuid,
  p_plan_type text,
  p_case_id uuid DEFAULT NULL,
  p_round_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_generation_id uuid DEFAULT NULL
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

  -- Fast idempotency check before any lock.
  IF p_generation_id IS NOT NULL THEN
    PERFORM 1
    FROM public.session_events
    WHERE user_id = p_user_id
      AND generation_id = p_generation_id
      AND delta = -1;
    IF FOUND THEN
      IF p_plan_type = 'standard' THEN
        SELECT standard_sessions INTO updated_remaining FROM public.profiles WHERE id = p_user_id;
      ELSE
        SELECT premium_sessions INTO updated_remaining FROM public.profiles WHERE id = p_user_id;
      END IF;
      RETURN QUERY SELECT true, COALESCE(updated_remaining, 0);
      RETURN;
    END IF;
  END IF;

  IF p_plan_type = 'standard' THEN
    SELECT standard_sessions INTO updated_remaining
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;
  ELSE
    SELECT premium_sessions INTO updated_remaining
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;
  END IF;

  IF updated_remaining IS NULL THEN
    RETURN QUERY SELECT false, NULL;
    RETURN;
  END IF;

  -- Re-check idempotency after acquiring the profile lock.
  IF p_generation_id IS NOT NULL THEN
    PERFORM 1
    FROM public.session_events
    WHERE user_id = p_user_id
      AND generation_id = p_generation_id
      AND delta = -1;
    IF FOUND THEN
      RETURN QUERY SELECT true, updated_remaining;
      RETURN;
    END IF;
  END IF;

  IF updated_remaining <= 0 THEN
    RETURN QUERY SELECT false, COALESCE(updated_remaining, 0);
    RETURN;
  END IF;

  IF p_plan_type = 'standard' THEN
    UPDATE public.profiles
      SET standard_sessions = standard_sessions - 1
      WHERE id = p_user_id;
  ELSE
    UPDATE public.profiles
      SET premium_sessions = premium_sessions - 1
      WHERE id = p_user_id;
  END IF;

  updated_remaining := updated_remaining - 1;

  safe_round_id := p_round_id;
  IF safe_round_id IS NOT NULL THEN
    PERFORM 1 FROM public.rounds WHERE id = safe_round_id;
    IF NOT FOUND THEN
      safe_round_id := NULL;
    END IF;
  END IF;

  INSERT INTO public.session_events(user_id, case_id, round_id, plan_type, delta, reason, generation_id)
  VALUES (p_user_id, p_case_id, safe_round_id, p_plan_type, -1, p_reason, p_generation_id)
  ON CONFLICT DO NOTHING;

  RETURN QUERY SELECT true, updated_remaining;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_session(
  p_user_id uuid,
  p_plan_type text,
  p_case_id uuid DEFAULT NULL,
  p_round_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL
) RETURNS TABLE(consumed boolean, remaining integer)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.consume_session(p_user_id, p_plan_type, p_case_id, p_round_id, p_reason, NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_session(uuid, text, uuid, uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_session(uuid, text, uuid, uuid, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_session(uuid, text, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_session(uuid, text, uuid, uuid, text) TO service_role;

-- 5) Refund idempotency with generation_id.
DROP FUNCTION IF EXISTS public.refund_session(uuid, text, uuid, uuid, text);
CREATE OR REPLACE FUNCTION public.refund_session(
  p_user_id uuid,
  p_plan_type text,
  p_case_id uuid DEFAULT NULL,
  p_round_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_generation_id uuid DEFAULT NULL
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

  IF p_generation_id IS NOT NULL THEN
    PERFORM 1
    FROM public.session_events
    WHERE user_id = p_user_id
      AND generation_id = p_generation_id
      AND delta = 1;
    IF FOUND THEN
      RETURN;
    END IF;
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

  INSERT INTO public.session_events(user_id, case_id, round_id, plan_type, delta, reason, generation_id)
  VALUES (p_user_id, p_case_id, safe_round_id, p_plan_type, 1, p_reason, p_generation_id)
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_session(
  p_user_id uuid,
  p_plan_type text,
  p_case_id uuid DEFAULT NULL,
  p_round_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.refund_session(p_user_id, p_plan_type, p_case_id, p_round_id, p_reason, NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION public.refund_session(uuid, text, uuid, uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_session(uuid, text, uuid, uuid, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_session(uuid, text, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_session(uuid, text, uuid, uuid, text) TO service_role;
