CREATE TABLE public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vic_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_by uuid,
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_name text,
  birth_date text,
  birth_place text,
  street text,
  postal_code text,
  city text,
  bank text NOT NULL,
  auftraege text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'in_bearbeitung',
  error text,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.verification_requests TO authenticated;
GRANT ALL ON public.verification_requests TO service_role;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read requests" ON public.verification_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Callers read requests of assigned vics" ON public.verification_requests FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'caller') AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = vic_id AND p.assigned_caller_id = auth.uid()));