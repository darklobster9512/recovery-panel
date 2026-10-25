ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS dismissed_at timestamptz, ADD COLUMN IF NOT EXISTS dismissed_by uuid;
CREATE OR REPLACE FUNCTION public.dismiss_verification_request(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.verification_requests r JOIN public.profiles p ON p.id = r.vic_id
    WHERE r.id = _id AND p.assigned_caller_id = auth.uid())) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  UPDATE public.verification_requests SET dismissed_at = now(), dismissed_by = auth.uid() WHERE id = _id;
END; $$;
REVOKE ALL ON FUNCTION public.dismiss_verification_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dismiss_verification_request(uuid) TO authenticated;