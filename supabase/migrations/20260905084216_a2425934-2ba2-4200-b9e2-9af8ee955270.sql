CREATE POLICY "Callers can read verifications"
  ON public.verifications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'caller'));

CREATE POLICY "Callers insert assignments for assigned vics"
  ON public.verification_assignments FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p
                WHERE p.id = verification_assignments.user_id
                  AND p.assigned_caller_id = auth.uid())
  );

CREATE POLICY "Callers update assignments for assigned vics"
  ON public.verification_assignments FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p
                WHERE p.id = verification_assignments.user_id
                  AND p.assigned_caller_id = auth.uid())
  );

CREATE POLICY "Callers insert documents for assigned vics"
  ON public.user_documents FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p
                WHERE p.id = user_documents.user_id
                  AND p.assigned_caller_id = auth.uid())
  );

CREATE POLICY "Callers can read all phone numbers"
  ON public.phone_numbers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'caller'));