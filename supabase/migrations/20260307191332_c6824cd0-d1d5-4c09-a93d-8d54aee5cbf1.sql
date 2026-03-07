CREATE TABLE public.verification_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES public.verifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_values jsonb NOT NULL DEFAULT '{}',
  phone_number_id uuid REFERENCES public.phone_numbers(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.verification_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage verification_assignments"
  ON public.verification_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));