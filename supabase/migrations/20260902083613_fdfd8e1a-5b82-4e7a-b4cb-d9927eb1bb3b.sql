
-- app_settings singleton
CREATE TABLE public.app_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  company_name text NOT NULL DEFAULT '',
  street text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  lawyer text NOT NULL DEFAULT '',
  vat_id text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  panel_subprefix text NOT NULL DEFAULT 'web',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read app_settings"
  ON public.app_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage app_settings"
  ON public.app_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_app_settings_updated
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.leads_touch_updated_at();

INSERT INTO public.app_settings
  (id, company_name, street, city, phone, email, lawyer, vat_id, website, panel_subprefix)
VALUES
  (true, 'Korte & Partner', 'Domstraße 15', '20095 Hamburg', '040 573086460',
   'info@korte-kanzlei.de', 'Dr. Thomas Korte', 'DE317391938', 'korte-kanzlei.de', 'web');

-- sms_templates_config
CREATE TABLE public.sms_templates_config (
  key text PRIMARY KEY,
  content text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sms_templates_config TO authenticated;
GRANT ALL ON public.sms_templates_config TO service_role;

ALTER TABLE public.sms_templates_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read sms_templates_config"
  ON public.sms_templates_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage sms_templates_config"
  ON public.sms_templates_config FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_sms_templates_config_updated
  BEFORE UPDATE ON public.sms_templates_config
  FOR EACH ROW EXECUTE FUNCTION public.leads_touch_updated_at();

INSERT INTO public.sms_templates_config (key, content) VALUES
  ('credentials',
   'Guten Tag {{first_name}} {{last_name}}, Ihr Zugang zum Mandantenportal von {{company_name}} wurde eingerichtet. Ihre Zugangsdaten finden Sie in der E-Mail an {{email}}.');
