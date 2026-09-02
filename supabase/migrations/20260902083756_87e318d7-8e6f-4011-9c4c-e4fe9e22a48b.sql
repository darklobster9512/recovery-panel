
ALTER TABLE public.app_settings
  ADD COLUMN resend_api_key text NOT NULL DEFAULT '',
  ADD COLUMN resend_from_name text NOT NULL DEFAULT '',
  ADD COLUMN resend_from_email text NOT NULL DEFAULT '',
  ADD COLUMN sevenio_api_key text NOT NULL DEFAULT '',
  ADD COLUMN sevenio_from_name text NOT NULL DEFAULT '';

DROP POLICY IF EXISTS "Anyone authenticated can read app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Anyone authenticated can read sms_templates_config" ON public.sms_templates_config;
