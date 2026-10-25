CREATE TABLE public.brandings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT '',
  tagline text NOT NULL DEFAULT '',
  logo_url text,
  favicon_url text,
  brand_color text NOT NULL DEFAULT '#0061FF',
  street text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  lawyer text NOT NULL DEFAULT '',
  vat_id text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  domain text NOT NULL DEFAULT '',
  additional_domains text[] NOT NULL DEFAULT '{}',
  panel_subprefix text NOT NULL DEFAULT 'portal',
  resend_api_key text NOT NULL DEFAULT '',
  resend_from_name text NOT NULL DEFAULT '',
  resend_from_email text NOT NULL DEFAULT '',
  sevenio_api_key text NOT NULL DEFAULT '',
  sevenio_from_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brandings TO authenticated;
GRANT ALL ON public.brandings TO service_role;
ALTER TABLE public.brandings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage brandings" ON public.brandings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_brandings_updated BEFORE UPDATE ON public.brandings
  FOR EACH ROW EXECUTE FUNCTION public.leads_touch_updated_at();

ALTER TABLE public.leads ADD COLUMN branding_id uuid REFERENCES public.brandings(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN branding_id uuid REFERENCES public.brandings(id) ON DELETE SET NULL;
ALTER TABLE public.phone_numbers ADD COLUMN branding_id uuid REFERENCES public.brandings(id) ON DELETE SET NULL;
CREATE INDEX idx_leads_branding ON public.leads(branding_id);
CREATE INDEX idx_profiles_branding ON public.profiles(branding_id);
CREATE INDEX idx_phone_numbers_branding ON public.phone_numbers(branding_id);

DO $$
DECLARE s record; bid uuid;
BEGIN
  SELECT * INTO s FROM public.app_settings WHERE id = true;
  INSERT INTO public.brandings (company_name, tagline, street, city, phone, email, lawyer, vat_id, website, domain,
    additional_domains, panel_subprefix, resend_api_key, resend_from_name, resend_from_email, sevenio_api_key, sevenio_from_name)
  VALUES (COALESCE(s.company_name,'Korte & Partner'), 'Rechtsanwaltskanzlei', COALESCE(s.street,''), COALESCE(s.city,''),
    COALESCE(s.phone,''), COALESCE(s.email,''), COALESCE(s.lawyer,''), COALESCE(s.vat_id,''), COALESCE(s.website,''),
    'kortekanzlei.de', ARRAY['kortekanzlei.com'], COALESCE(s.panel_subprefix,'portal'),
    COALESCE(s.resend_api_key,''), COALESCE(s.resend_from_name,''), COALESCE(s.resend_from_email,''),
    COALESCE(s.sevenio_api_key,''), COALESCE(s.sevenio_from_name,''))
  RETURNING id INTO bid;
  UPDATE public.leads SET branding_id = bid WHERE branding_id IS NULL;
  UPDATE public.profiles SET branding_id = bid WHERE branding_id IS NULL;
  UPDATE public.phone_numbers SET branding_id = bid WHERE branding_id IS NULL;
END $$;

CREATE OR REPLACE FUNCTION public.profiles_inherit_branding()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.branding_id IS NULL AND NEW.source_lead_id IS NOT NULL THEN
    SELECT branding_id INTO NEW.branding_id FROM public.leads WHERE id = NEW.source_lead_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_profiles_inherit_branding BEFORE INSERT OR UPDATE OF source_lead_id ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_inherit_branding();

CREATE OR REPLACE FUNCTION public.get_branding_for_host(_host text)
RETURNS TABLE(id uuid, company_name text, tagline text, logo_url text, favicon_url text, brand_color text,
  street text, city text, phone text, email text, lawyer text, vat_id text, website text, domain text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH h AS (SELECT lower(coalesce(_host,'')) AS host,
    lower(array_to_string((string_to_array(lower(coalesce(_host,'')), '.'))[greatest(array_length(string_to_array(coalesce(_host,''), '.'),1)-1,1):], '.')) AS root)
  SELECT b.id, b.company_name, b.tagline, b.logo_url, b.favicon_url, b.brand_color, b.street, b.city, b.phone,
    b.email, b.lawyer, b.vat_id, b.website, b.domain
  FROM public.brandings b, h
  ORDER BY
    CASE WHEN lower(b.domain) = h.host THEN 0
         WHEN lower(b.domain) = h.root THEN 1
         WHEN h.host = ANY(b.additional_domains) OR h.root = ANY(b.additional_domains) THEN 2
         ELSE 3 END,
    b.created_at
  LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.get_branding_for_host(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.my_branding()
RETURNS TABLE(id uuid, company_name text, tagline text, logo_url text, brand_color text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.id, b.company_name, b.tagline, b.logo_url, b.brand_color
  FROM public.brandings b JOIN public.profiles p ON p.branding_id = b.id
  WHERE p.id = auth.uid()
$$;
GRANT EXECUTE ON FUNCTION public.my_branding() TO authenticated;