CREATE POLICY "Callers delete documents for assigned vics"
ON public.user_documents
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'caller')
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_documents.user_id
      AND p.assigned_caller_id = auth.uid()
  )
);