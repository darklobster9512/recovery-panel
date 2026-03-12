
-- Storage Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('user-documents', 'user-documents', false);

-- RLS für Storage: Nutzer können eigene Dateien hochladen
CREATE POLICY "Users upload own documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS für Storage: Nutzer können eigene Dateien lesen
CREATE POLICY "Users read own documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS für Storage: Admins können alle Dateien lesen
CREATE POLICY "Admins read all documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'user-documents' AND public.has_role(auth.uid(), 'admin'));

-- Metadata-Tabelle
CREATE TABLE public.user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES public.verification_assignments(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own documents" ON public.user_documents
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users insert own documents" ON public.user_documents
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins read all documents" ON public.user_documents
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
