CREATE POLICY "Admins insert documents for users"
ON public.user_documents
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));