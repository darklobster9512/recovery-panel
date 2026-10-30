CREATE OR REPLACE FUNCTION public.call_stats_totals()
RETURNS TABLE(today_sec bigint, week_sec bigint, month_sec bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE d date := (now() AT TIME ZONE 'Europe/Berlin')::date;
  w date := date_trunc('week', d)::date; m date := date_trunc('month', d)::date;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'not allowed'; END IF;
  RETURN QUERY WITH x AS (SELECT (started_at AT TIME ZONE 'Europe/Berlin')::date AS dd, duration_sec FROM public.call_logs
    WHERE started_at >= (least(w,m)::timestamp AT TIME ZONE 'Europe/Berlin'))
  SELECT coalesce(sum(duration_sec) FILTER (WHERE dd = d),0)::bigint,
    coalesce(sum(duration_sec) FILTER (WHERE dd BETWEEN w AND w+6),0)::bigint,
    coalesce(sum(duration_sec) FILTER (WHERE dd >= m AND dd < (m + interval '1 month')::date),0)::bigint FROM x;
END; $$;
REVOKE EXECUTE ON FUNCTION public.call_stats_totals() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.call_stats_by_caller(date,date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.call_stats_by_day(date,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.call_stats_totals() TO authenticated;
GRANT EXECUTE ON FUNCTION public.call_stats_by_caller(date,date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.call_stats_by_day(date,date) TO authenticated;