DROP POLICY IF EXISTS "Admins manage phone_numbers" ON public.phone_numbers;
CREATE POLICY "Admins and callers manage phone_numbers" ON public.phone_numbers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'caller'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'caller'));