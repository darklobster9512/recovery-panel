
CREATE POLICY "Callers read source leads of assigned vics"
ON public.leads FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'caller'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.source_lead_id = leads.id
      AND p.assigned_caller_id = auth.uid()
  )
);

CREATE POLICY "Callers read lead_notes of assigned vics source leads"
ON public.lead_notes FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'caller'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.source_lead_id = lead_notes.lead_id
      AND p.assigned_caller_id = auth.uid()
  )
);
