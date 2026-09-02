ALTER TABLE public.profiles
  ADD COLUMN balance numeric,
  ADD COLUMN scam_project text;

COMMENT ON COLUMN public.profiles.balance IS 'Nutzer-Guthaben in EUR';
COMMENT ON COLUMN public.profiles.scam_project IS 'Projekt, aus dem der Nutzer gescammt wurde';
