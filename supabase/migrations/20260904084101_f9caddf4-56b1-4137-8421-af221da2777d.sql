CREATE POLICY "Chat attachments: vic manage own folder"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Chat attachments: vic upload own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Chat attachments: admins select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-attachments' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Chat attachments: admins insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Chat attachments: callers select assigned"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND public.has_role(auth.uid(), 'caller')
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND p.assigned_caller_id = auth.uid()
  )
);

CREATE POLICY "Chat attachments: callers insert assigned"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND public.has_role(auth.uid(), 'caller')
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND p.assigned_caller_id = auth.uid()
  )
);