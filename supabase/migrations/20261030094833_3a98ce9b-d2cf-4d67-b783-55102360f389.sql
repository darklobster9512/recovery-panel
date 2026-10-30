CREATE TABLE public.call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id uuid NULL,
  caller_name text,
  slot int NOT NULL,
  bot_number text NOT NULL,
  direction text NOT NULL,
  remote_number text,
  remote_name text,
  status text NOT NULL,
  started_at timestamptz NOT NULL,
  answered_at timestamptz,
  ended_at timestamptz,
  duration_sec int NOT NULL DEFAULT 0,
  hold_sec int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.call_logs TO authenticated;
GRANT ALL ON public.call_logs TO service_role;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read call logs" ON public.call_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX call_logs_caller_started_idx ON public.call_logs (caller_id, started_at);
CREATE INDEX call_logs_started_idx ON public.call_logs (started_at DESC);

CREATE OR REPLACE FUNCTION public.call_logs_validate() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.direction NOT IN ('in','out') THEN RAISE EXCEPTION 'invalid direction'; END IF;
  IF NEW.status NOT IN ('answered','missed','rejected','busy') THEN RAISE EXCEPTION 'invalid status'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_call_logs_validate BEFORE INSERT OR UPDATE ON public.call_logs FOR EACH ROW EXECUTE FUNCTION public.call_logs_validate();

CREATE OR REPLACE FUNCTION public.call_stats_totals()
RETURNS TABLE(today_sec bigint, week_sec bigint, month_sec bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE d date := (now() AT TIME ZONE 'Europe/Berlin')::date;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'not allowed'; END IF;
  RETURN QUERY SELECT
    coalesce(sum(duration_sec) FILTER (WHERE (started_at AT TIME ZONE 'Europe/Berlin')::date = d),0)::bigint,
    coalesce(sum(duration_sec) FILTER (WHERE (started_at AT TIME ZONE 'Europe/Berlin')::date >= date_trunc('week', d)::date),0)::bigint,
    coalesce(sum(duration_sec),0)::bigint
  FROM public.call_logs
  WHERE (started_at AT TIME ZONE 'Europe/Berlin')::date >= least(date_trunc('month', d)::date, date_trunc('week', d)::date)
    AND (started_at AT TIME ZONE 'Europe/Berlin')::date <= d
    AND ((started_at AT TIME ZONE 'Europe/Berlin')::date >= date_trunc('month', d)::date OR true);
END; $$;

CREATE OR REPLACE FUNCTION public.call_stats_by_caller(_from date, _to date)
RETURNS TABLE(caller_id uuid, caller_name text, calls bigint, total_sec bigint, avg_sec numeric, missed bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'not allowed'; END IF;
  RETURN QUERY SELECT c.caller_id, max(c.caller_name),
    count(*) FILTER (WHERE c.status='answered'),
    coalesce(sum(c.duration_sec),0)::bigint,
    CASE WHEN count(*) FILTER (WHERE c.status='answered') > 0
      THEN round(sum(c.duration_sec)::numeric / count(*) FILTER (WHERE c.status='answered')) ELSE 0 END,
    count(*) FILTER (WHERE c.status='missed')
  FROM public.call_logs c
  WHERE (c.started_at AT TIME ZONE 'Europe/Berlin')::date BETWEEN _from AND _to
  GROUP BY c.caller_id ORDER BY 4 DESC;
END; $$;

CREATE OR REPLACE FUNCTION public.call_stats_by_day(_from date, _to date)
RETURNS TABLE(day date, total_sec bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'not allowed'; END IF;
  RETURN QUERY SELECT g::date, coalesce(sum(c.duration_sec),0)::bigint
  FROM generate_series(_from, _to, interval '1 day') g
  LEFT JOIN public.call_logs c ON (c.started_at AT TIME ZONE 'Europe/Berlin')::date = g::date
  GROUP BY g ORDER BY g;
END; $$;