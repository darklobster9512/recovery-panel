
CREATE POLICY "Admins manage caller-avatars"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'caller-avatars' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'caller-avatars' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated read caller-avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'caller-avatars');
