
-- Profile-Erweiterungen
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS assigned_caller_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS member_status text NOT NULL DEFAULT 'in_bearbeitung'
    CHECK (member_status IN ('in_bearbeitung','aktiv'));

CREATE INDEX IF NOT EXISTS idx_profiles_assigned_caller ON public.profiles(assigned_caller_id);

-- Leads-Erweiterung
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS assigned_caller_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_assigned_caller ON public.leads(assigned_caller_id);

-- Backfill member_status: aktiv wenn Ausweis bereits hochgeladen
UPDATE public.profiles
   SET member_status = 'aktiv'
 WHERE id_document_submitted_at IS NOT NULL;

-- Trigger: setze member_status automatisch bei Ausweis-Upload
CREATE OR REPLACE FUNCTION public.profiles_sync_member_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.id_document_submitted_at IS NOT NULL
     AND (OLD.id_document_submitted_at IS NULL OR OLD.id_document_submitted_at IS DISTINCT FROM NEW.id_document_submitted_at)
     AND NEW.member_status = 'in_bearbeitung' THEN
    NEW.member_status := 'aktiv';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_sync_member_status ON public.profiles;
CREATE TRIGGER trg_profiles_sync_member_status
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_sync_member_status();

-- Caller-RLS Policies

-- Callers dürfen ihre zugewiesenen Leads lesen und bearbeiten
CREATE POLICY "Callers read assigned leads"
  ON public.leads FOR SELECT TO authenticated
  USING (assigned_caller_id = auth.uid() AND public.has_role(auth.uid(), 'caller'));

CREATE POLICY "Callers update assigned leads"
  ON public.leads FOR UPDATE TO authenticated
  USING (assigned_caller_id = auth.uid() AND public.has_role(auth.uid(), 'caller'))
  WITH CHECK (assigned_caller_id = auth.uid() AND public.has_role(auth.uid(), 'caller'));

-- Callers dürfen zugewiesene Vic-Profile lesen; darüber hinaus jedes Caller-Profil (für Avatare)
CREATE POLICY "Callers read assigned vic profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (assigned_caller_id = auth.uid() AND public.has_role(auth.uid(), 'caller'));

CREATE POLICY "Everyone authenticated reads caller profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(id, 'caller'));

-- Lead notes: Caller lesen Notizen der zugewiesenen Leads
CREATE POLICY "Callers read lead_notes for assigned leads"
  ON public.lead_notes FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_notes.lead_id AND l.assigned_caller_id = auth.uid())
  );

CREATE POLICY "Callers insert lead_notes for assigned leads"
  ON public.lead_notes FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_notes.lead_id AND l.assigned_caller_id = auth.uid())
  );

-- Lead activity: Caller lesen Aktivitäten der zugewiesenen Leads
CREATE POLICY "Callers read lead_activity for assigned leads"
  ON public.lead_activity FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_activity.lead_id AND l.assigned_caller_id = auth.uid())
  );

-- Verification assignments: Caller sehen Aufträge zugewiesener Vics
CREATE POLICY "Callers read assignments for assigned vics"
  ON public.verification_assignments FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = verification_assignments.user_id AND p.assigned_caller_id = auth.uid())
  );

-- User documents: Caller sehen Dokumente zugewiesener Vics
CREATE POLICY "Callers read documents for assigned vics"
  ON public.user_documents FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_documents.user_id AND p.assigned_caller_id = auth.uid())
  );

-- User notes: Caller sehen Notizen zugewiesener Vics
CREATE POLICY "Callers read user_notes for assigned vics"
  ON public.user_notes FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_notes.user_id AND p.assigned_caller_id = auth.uid())
  );

CREATE POLICY "Callers insert user_notes for assigned vics"
  ON public.user_notes FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_notes.user_id AND p.assigned_caller_id = auth.uid())
  );

-- Neue SMS-Vorlage
INSERT INTO public.sms_templates_config (key, content) VALUES
  ('new_user_sms',
   'Guten Tag {{first_name}}, Sie haben sich bei {{company_name}} eingetragen. Unsere Blockchain-Forensik hat Vermögenswerte auf Ihren Namen gefunden. Details finden Sie in der E-Mail an {{email}}.')
ON CONFLICT (key) DO NOTHING;
