CREATE TABLE public.sms_dispatch_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  vic_id uuid,
  branding_id uuid,
  recipient text NOT NULL,
  sender text,
  ok boolean NOT NULL,
  code text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sms_dispatch_log TO authenticated;
GRANT ALL ON public.sms_dispatch_log TO service_role;
ALTER TABLE public.sms_dispatch_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read sms log" ON public.sms_dispatch_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX sms_dispatch_log_vic_idx ON public.sms_dispatch_log(vic_id, created_at DESC);