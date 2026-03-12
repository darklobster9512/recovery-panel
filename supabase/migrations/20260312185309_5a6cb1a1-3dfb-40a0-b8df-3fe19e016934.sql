ALTER TYPE public.assignment_status ADD VALUE IF NOT EXISTS 'in_ueberpruefung';
ALTER TYPE public.assignment_status ADD VALUE IF NOT EXISTS 'genehmigt';
ALTER TYPE public.assignment_status ADD VALUE IF NOT EXISTS 'abgelehnt';

CREATE POLICY "Users can submit for review"
ON public.verification_assignments
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());