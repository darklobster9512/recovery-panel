
-- Trigger entfernen (Status wird jetzt manuell gesetzt)
DROP TRIGGER IF EXISTS trg_profiles_sync_member_status ON public.profiles;
DROP FUNCTION IF EXISTS public.profiles_sync_member_status();

-- CHECK-Constraint erweitern
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_member_status_check;

-- Bestehende Werte migrieren
UPDATE public.profiles SET member_status = 'in_bearbeitung' WHERE member_status = 'aktiv';

-- Default auf 'neu'
ALTER TABLE public.profiles ALTER COLUMN member_status SET DEFAULT 'neu';

-- Neuer CHECK-Constraint
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_member_status_check
  CHECK (member_status IN ('neu','in_bearbeitung','erfolgreich','terminiert','mailbox','fehlgeschlagen'));

-- Caller darf Status seiner zugewiesenen Vics ändern
DROP POLICY IF EXISTS "Callers can update assigned vic status" ON public.profiles;
CREATE POLICY "Callers can update assigned vic status"
ON public.profiles
FOR UPDATE
TO authenticated
USING (assigned_caller_id = auth.uid() AND public.has_role(auth.uid(), 'caller'))
WITH CHECK (assigned_caller_id = auth.uid() AND public.has_role(auth.uid(), 'caller'));
