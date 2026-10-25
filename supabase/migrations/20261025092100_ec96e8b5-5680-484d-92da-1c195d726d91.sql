CREATE TABLE public.caller_account_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  caller_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.caller_account_links TO authenticated;
GRANT ALL ON public.caller_account_links TO service_role;
ALTER TABLE public.caller_account_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage caller links" ON public.caller_account_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.my_linked_callers()
RETURNS TABLE(caller_id uuid, first_name text, last_name text, email text, branding_id uuid, company_name text, logo_url text, brand_color text, is_self boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.first_name, p.last_name, p.email, b.id, b.company_name, b.logo_url, b.brand_color, p.id = auth.uid()
  FROM public.caller_account_links l
  JOIN public.caller_account_links me ON me.group_id = l.group_id AND me.caller_id = auth.uid()
  JOIN public.profiles p ON p.id = l.caller_id
  LEFT JOIN public.brandings b ON b.id = p.branding_id
  WHERE public.has_role(l.caller_id, 'caller')
  ORDER BY b.company_name
$$;
REVOKE ALL ON FUNCTION public.my_linked_callers() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.my_linked_callers() TO authenticated;