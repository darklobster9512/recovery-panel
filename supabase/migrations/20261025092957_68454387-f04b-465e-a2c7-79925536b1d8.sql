DROP POLICY "Admins and callers can update contact requests" ON public.contact_requests;
DROP POLICY "Admins and callers can view contact requests" ON public.contact_requests;
CREATE POLICY "Admins can view contact requests" ON public.contact_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update contact requests" ON public.contact_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));