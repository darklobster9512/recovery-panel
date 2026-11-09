CREATE TABLE public.instructions (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  content text NOT NULL DEFAULT '',
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.instructions TO authenticated;
GRANT ALL ON public.instructions TO service_role;
ALTER TABLE public.instructions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read instructions" ON public.instructions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'caller'));
CREATE POLICY "Admins insert instructions" ON public.instructions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update instructions" ON public.instructions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_instructions_updated BEFORE UPDATE ON public.instructions
  FOR EACH ROW EXECUTE FUNCTION public.leads_touch_updated_at();
INSERT INTO public.instructions (id, content) VALUES (true, '');

CREATE POLICY "Staff read instruction images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'instruction-images' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'caller')));
CREATE POLICY "Admins upload instruction images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'instruction-images' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete instruction images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'instruction-images' AND public.has_role(auth.uid(),'admin'));