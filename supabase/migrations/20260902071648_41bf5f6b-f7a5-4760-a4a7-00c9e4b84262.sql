ALTER TABLE public.verifications
  ADD COLUMN type text NOT NULL DEFAULT 'videocall'
  CHECK (type IN ('videocall','postident'));