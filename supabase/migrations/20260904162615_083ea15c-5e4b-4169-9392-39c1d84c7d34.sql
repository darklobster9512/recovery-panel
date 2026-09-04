ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS reason text;

GRANT UPDATE (reason) ON public.appointments TO authenticated;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Callers insert appointments for assigned vics"
  ON public.appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'caller'::app_role)
    AND caller_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = vic_id AND p.assigned_caller_id = auth.uid()
    )
  );