CREATE POLICY "Admins insert documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'user-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'user-documents' AND public.has_role(auth.uid(), 'admin'));