
CREATE POLICY "Users can read own assignments"
ON public.verification_assignments
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can read assigned verifications"
ON public.verifications
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.verification_assignments
    WHERE verification_id = verifications.id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can read assigned phone numbers"
ON public.phone_numbers
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.verification_assignments
    WHERE phone_number_id = phone_numbers.id
    AND user_id = auth.uid()
  )
);
