CREATE TABLE public.verification_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.verification_requests(id) ON DELETE CASCADE,
  vic_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  auftrag_key text NOT NULL,
  verification_id uuid REFERENCES public.verifications(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'in_bearbeitung',
  field_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  anosim_link text,
  pdf_path text,
  pdf_name text,
  assignment_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, auftrag_key)
);
GRANT SELECT ON public.verification_request_items TO authenticated;
GRANT ALL ON public.verification_request_items TO service_role;
ALTER TABLE public.verification_request_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read request items" ON public.verification_request_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Callers read request items of assigned vics" ON public.verification_request_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'caller') AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = vic_id AND p.assigned_caller_id = auth.uid()));
CREATE TRIGGER trg_vri_updated BEFORE UPDATE ON public.verification_request_items
  FOR EACH ROW EXECUTE FUNCTION public.leads_touch_updated_at();