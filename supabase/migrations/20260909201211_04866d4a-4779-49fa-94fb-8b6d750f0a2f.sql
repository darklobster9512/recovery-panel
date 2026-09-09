
CREATE TABLE public.contact_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  topic text NOT NULL,
  damage_amount numeric,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'neu',
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.contact_requests TO authenticated;
GRANT ALL ON public.contact_requests TO service_role;

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and callers can view contact requests"
  ON public.contact_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'caller'));

CREATE POLICY "Admins and callers can update contact requests"
  ON public.contact_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'caller'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'caller'));

CREATE TRIGGER trg_contact_requests_updated
  BEFORE UPDATE ON public.contact_requests
  FOR EACH ROW EXECUTE FUNCTION public.leads_touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_requests;
ALTER TABLE public.contact_requests REPLICA IDENTITY FULL;

ALTER TYPE public.telegram_event ADD VALUE IF NOT EXISTS 'contact_request_received';
