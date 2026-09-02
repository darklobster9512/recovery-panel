
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_document_submitted_at timestamptz;
ALTER TABLE public.user_documents ALTER COLUMN assignment_id DROP NOT NULL;
ALTER TABLE public.user_documents ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'assignment';
