CREATE TABLE public.sms_spoof_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient text NOT NULL,
  sender_id text NOT NULL,
  message text NOT NULL,
  response jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sms_spoof_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sms_spoof_history"
  ON public.sms_spoof_history FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));