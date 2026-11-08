
CREATE TABLE public.manager_callers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caller_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_callers TO authenticated;
GRANT ALL ON public.manager_callers TO service_role;
ALTER TABLE public.manager_callers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.manager_brandings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  branding_id uuid NOT NULL REFERENCES public.brandings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (manager_id, branding_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_brandings TO authenticated;
GRANT ALL ON public.manager_brandings TO service_role;
ALTER TABLE public.manager_brandings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS profiles_assigned_manager_idx ON public.profiles(assigned_manager_id);

CREATE OR REPLACE FUNCTION public.is_manager_of_caller(_mgr uuid, _caller uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_mgr,'manager') AND EXISTS (SELECT 1 FROM public.manager_callers WHERE manager_id = _mgr AND caller_id = _caller)
$$;

CREATE OR REPLACE FUNCTION public.manager_can_see_vic(_mgr uuid, _vic uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_mgr,'manager') AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _vic AND (p.assigned_manager_id = _mgr
      OR EXISTS (SELECT 1 FROM public.manager_callers mc WHERE mc.manager_id = _mgr AND mc.caller_id = p.assigned_caller_id)))
$$;

CREATE POLICY "Admins manage manager_callers" ON public.manager_callers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Managers read own callers" ON public.manager_callers FOR SELECT TO authenticated
  USING (manager_id = auth.uid());
CREATE POLICY "Admins manage manager_brandings" ON public.manager_brandings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Managers read own brandings" ON public.manager_brandings FOR SELECT TO authenticated
  USING (manager_id = auth.uid());

-- Brands of a manager (public fields only)
CREATE OR REPLACE FUNCTION public.my_manager_brandings()
RETURNS TABLE(id uuid, company_name text, tagline text, logo_url text, favicon_url text, brand_color text, domain text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.id, b.company_name, b.tagline, b.logo_url, b.favicon_url, b.brand_color, b.domain, b.created_at
  FROM public.brandings b JOIN public.manager_brandings mb ON mb.branding_id = b.id
  WHERE mb.manager_id = auth.uid() ORDER BY b.created_at
$$;

-- Assigning a caller pulls in the caller's manager
CREATE OR REPLACE FUNCTION public.profiles_manager_rules()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m uuid;
BEGIN
  IF public.has_role(auth.uid(),'manager') AND NOT public.has_role(auth.uid(),'admin') AND NEW.id <> auth.uid() THEN
    NEW.assigned_manager_id := OLD.assigned_manager_id;
    NEW.branding_id := OLD.branding_id;
    NEW.email := OLD.email;
    NEW.balance := OLD.balance;
    NEW.source_lead_id := OLD.source_lead_id;
    IF NEW.assigned_caller_id IS DISTINCT FROM OLD.assigned_caller_id
       AND NEW.assigned_caller_id IS NOT NULL
       AND NOT public.is_manager_of_caller(auth.uid(), NEW.assigned_caller_id) THEN
      RAISE EXCEPTION 'caller not managed by you';
    END IF;
  END IF;
  IF NEW.assigned_caller_id IS DISTINCT FROM OLD.assigned_caller_id AND NEW.assigned_caller_id IS NOT NULL THEN
    SELECT manager_id INTO m FROM public.manager_callers WHERE caller_id = NEW.assigned_caller_id;
    IF m IS NOT NULL THEN NEW.assigned_manager_id := m; END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_profiles_manager_rules BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_manager_rules();

-- profiles
CREATE POLICY "Managers read visible vics" ON public.profiles FOR SELECT TO authenticated
  USING (public.manager_can_see_vic(auth.uid(), id));
CREATE POLICY "Managers update visible vics" ON public.profiles FOR UPDATE TO authenticated
  USING (public.manager_can_see_vic(auth.uid(), id)) WITH CHECK (public.manager_can_see_vic(auth.uid(), id));
CREATE POLICY "Managers read own caller profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.is_manager_of_caller(auth.uid(), id));
CREATE POLICY "Managers update own caller profiles" ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_manager_of_caller(auth.uid(), id)) WITH CHECK (public.is_manager_of_caller(auth.uid(), id));

-- user_roles
CREATE POLICY "Managers read roles of visible people" ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_manager_of_caller(auth.uid(), user_id) OR public.manager_can_see_vic(auth.uid(), user_id));

-- appointments
CREATE POLICY "Managers manage visible appointments" ON public.appointments FOR ALL TO authenticated
  USING (public.manager_can_see_vic(auth.uid(), vic_id)) WITH CHECK (public.manager_can_see_vic(auth.uid(), vic_id));

-- chat
CREATE POLICY "Managers select visible chat" ON public.chat_messages FOR SELECT TO authenticated
  USING (public.manager_can_see_vic(auth.uid(), vic_id));
CREATE POLICY "Managers insert visible chat" ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (public.manager_can_see_vic(auth.uid(), vic_id) AND sender_user_id = auth.uid());
CREATE POLICY "Managers update visible chat" ON public.chat_messages FOR UPDATE TO authenticated
  USING (public.manager_can_see_vic(auth.uid(), vic_id)) WITH CHECK (public.manager_can_see_vic(auth.uid(), vic_id));
CREATE POLICY "Managers read chat templates" ON public.chat_templates FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'manager'));

-- verifications
CREATE POLICY "Managers read verifications" ON public.verifications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'manager'));
CREATE POLICY "Managers manage visible assignments" ON public.verification_assignments FOR ALL TO authenticated
  USING (public.manager_can_see_vic(auth.uid(), user_id)) WITH CHECK (public.manager_can_see_vic(auth.uid(), user_id));
CREATE POLICY "Managers read visible requests" ON public.verification_requests FOR SELECT TO authenticated
  USING (public.manager_can_see_vic(auth.uid(), vic_id));
CREATE POLICY "Managers read visible request items" ON public.verification_request_items FOR SELECT TO authenticated
  USING (public.manager_can_see_vic(auth.uid(), vic_id));
CREATE POLICY "Managers read phone numbers" ON public.phone_numbers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'manager'));

-- documents & notes
CREATE POLICY "Managers read visible documents" ON public.user_documents FOR SELECT TO authenticated
  USING (public.manager_can_see_vic(auth.uid(), user_id));
CREATE POLICY "Managers insert visible documents" ON public.user_documents FOR INSERT TO authenticated
  WITH CHECK (public.manager_can_see_vic(auth.uid(), user_id));
CREATE POLICY "Managers delete visible documents" ON public.user_documents FOR DELETE TO authenticated
  USING (public.manager_can_see_vic(auth.uid(), user_id));
CREATE POLICY "Managers manage visible user notes" ON public.user_notes FOR ALL TO authenticated
  USING (public.manager_can_see_vic(auth.uid(), user_id)) WITH CHECK (public.manager_can_see_vic(auth.uid(), user_id));

-- call logs
CREATE POLICY "Managers read own callers call logs" ON public.call_logs FOR SELECT TO authenticated
  USING (public.is_manager_of_caller(auth.uid(), caller_id));

-- storage
CREATE POLICY "Managers read visible documents files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('user-documents','chat-attachments') AND public.manager_can_see_vic(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "Managers upload visible documents files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('user-documents','chat-attachments') AND public.manager_can_see_vic(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "Managers delete visible documents files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'user-documents' AND public.manager_can_see_vic(auth.uid(), ((storage.foldername(name))[1])::uuid));

-- call stats: admins all, managers only their callers
CREATE OR REPLACE FUNCTION public.call_stats_by_caller(_from date, _to date)
 RETURNS TABLE(caller_id uuid, caller_name text, calls bigint, total_sec bigint, avg_sec numeric, missed bigint)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE adm boolean := public.has_role(auth.uid(),'admin');
BEGIN
  IF NOT (adm OR public.has_role(auth.uid(),'manager')) THEN RAISE EXCEPTION 'not allowed'; END IF;
  RETURN QUERY SELECT c.caller_id, max(c.caller_name),
    count(*) FILTER (WHERE c.status='answered'),
    coalesce(sum(c.duration_sec),0)::bigint,
    CASE WHEN count(*) FILTER (WHERE c.status='answered') > 0
      THEN round(sum(c.duration_sec)::numeric / count(*) FILTER (WHERE c.status='answered')) ELSE 0 END,
    count(*) FILTER (WHERE c.status='missed')
  FROM public.call_logs c
  WHERE (c.started_at AT TIME ZONE 'Europe/Berlin')::date BETWEEN _from AND _to
    AND (adm OR c.caller_id IN (SELECT mc.caller_id FROM public.manager_callers mc WHERE mc.manager_id = auth.uid()))
  GROUP BY c.caller_id ORDER BY 4 DESC;
END; $function$;

CREATE OR REPLACE FUNCTION public.call_stats_by_day(_from date, _to date)
 RETURNS TABLE(day date, total_sec bigint)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE adm boolean := public.has_role(auth.uid(),'admin');
BEGIN
  IF NOT (adm OR public.has_role(auth.uid(),'manager')) THEN RAISE EXCEPTION 'not allowed'; END IF;
  RETURN QUERY SELECT g::date, coalesce(sum(c.duration_sec),0)::bigint
  FROM generate_series(_from, _to, interval '1 day') g
  LEFT JOIN public.call_logs c ON (c.started_at AT TIME ZONE 'Europe/Berlin')::date = g::date
    AND (adm OR c.caller_id IN (SELECT mc.caller_id FROM public.manager_callers mc WHERE mc.manager_id = auth.uid()))
  GROUP BY g ORDER BY g;
END; $function$;

CREATE OR REPLACE FUNCTION public.call_stats_totals()
 RETURNS TABLE(today_sec bigint, week_sec bigint, month_sec bigint)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE d date := (now() AT TIME ZONE 'Europe/Berlin')::date;
  w date := date_trunc('week', d)::date; m date := date_trunc('month', d)::date;
  adm boolean := public.has_role(auth.uid(),'admin');
BEGIN
  IF NOT (adm OR public.has_role(auth.uid(),'manager')) THEN RAISE EXCEPTION 'not allowed'; END IF;
  RETURN QUERY WITH x AS (SELECT (started_at AT TIME ZONE 'Europe/Berlin')::date AS dd, duration_sec FROM public.call_logs
    WHERE started_at >= (least(w,m)::timestamp AT TIME ZONE 'Europe/Berlin')
      AND (adm OR caller_id IN (SELECT mc.caller_id FROM public.manager_callers mc WHERE mc.manager_id = auth.uid())))
  SELECT coalesce(sum(duration_sec) FILTER (WHERE dd = d),0)::bigint,
    coalesce(sum(duration_sec) FILTER (WHERE dd BETWEEN w AND w+6),0)::bigint,
    coalesce(sum(duration_sec) FILTER (WHERE dd >= m AND dd < (m + interval '1 month')::date),0)::bigint FROM x;
END; $function$;
