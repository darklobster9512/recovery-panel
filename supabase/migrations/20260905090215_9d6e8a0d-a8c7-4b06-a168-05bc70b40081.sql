CREATE POLICY "Callers read assigned documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'user-documents'
  AND public.has_role(auth.uid(), 'caller')
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND p.assigned_caller_id = auth.uid()
  )
);