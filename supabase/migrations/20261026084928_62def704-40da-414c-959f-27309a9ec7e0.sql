CREATE OR REPLACE FUNCTION public.existing_lead_emails(_emails text[])
RETURNS SETOF text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'caller')) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  RETURN QUERY SELECT DISTINCT lower(trim(l.email)) FROM public.leads l
    WHERE l.email IS NOT NULL
      AND lower(trim(l.email)) = ANY(SELECT lower(trim(e)) FROM unnest(_emails) e);
END; $$;
REVOKE ALL ON FUNCTION public.existing_lead_emails(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.existing_lead_emails(text[]) TO authenticated;