GRANT DELETE ON public.user_documents TO authenticated;

CREATE POLICY "Admins delete documents"
ON public.user_documents
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));