CREATE TYPE public.assignment_status AS ENUM ('zugewiesen', 'in_bearbeitung', 'abgeschlossen');
ALTER TABLE public.verification_assignments
  ADD COLUMN status public.assignment_status NOT NULL DEFAULT 'zugewiesen';