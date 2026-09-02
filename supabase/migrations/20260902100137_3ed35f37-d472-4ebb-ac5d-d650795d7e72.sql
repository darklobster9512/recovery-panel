
ALTER TABLE public.verification_assignments
  ADD COLUMN IF NOT EXISTS forward_tan_to_vic boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS forwarded_sms jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing schedule if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'forward-tan-sweep') THEN
    PERFORM cron.unschedule('forward-tan-sweep');
  END IF;
END $$;

SELECT cron.schedule(
  'forward-tan-sweep',
  '15 seconds',
  $$
  SELECT net.http_post(
    url := 'https://ssxqmhnpnxnwaqquswwv.supabase.co/functions/v1/forward-tan-sweep',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeHFtaG5wbnhud2FxcXVzd3d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNTAwNjIsImV4cCI6MjEwMjYyNjA2Mn0.ryksNcmltYLE_RYV-ptkOx4Hk14uYfPfB0KgUPRCN8k"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
