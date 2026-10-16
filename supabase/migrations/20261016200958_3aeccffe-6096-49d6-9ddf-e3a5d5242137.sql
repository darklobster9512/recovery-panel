ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS backup_telegram_chat_id text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS backup_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS backup_last_at timestamptz,
  ADD COLUMN IF NOT EXISTS backup_last_error text;

CREATE TABLE IF NOT EXISTS public.backup_secrets (
  id boolean PRIMARY KEY DEFAULT true,
  cron_token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.backup_secrets TO service_role;
ALTER TABLE public.backup_secrets ENABLE ROW LEVEL SECURITY;
INSERT INTO public.backup_secrets (id) VALUES (true) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.backup_check_token(_token text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.backup_secrets WHERE cron_token = _token)
$$;
REVOKE EXECUTE ON FUNCTION public.backup_check_token(text) FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$ BEGIN PERFORM cron.unschedule('hourly-backup'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule('hourly-backup', '0 * * * *', $c$
  SELECT net.http_post(
    url := 'https://pcfmaslrlferrnoopgqn.supabase.co/functions/v1/admin-backup',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := jsonb_build_object('action','telegram','cron_token',(SELECT cron_token FROM public.backup_secrets WHERE id))
  );
$c$);