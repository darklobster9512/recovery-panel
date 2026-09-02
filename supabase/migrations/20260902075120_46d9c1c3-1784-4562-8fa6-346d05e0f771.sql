
-- Enum
CREATE TYPE public.lead_status AS ENUM ('neu','in_bearbeitung','mailbox','fehlgeschlagen','erfolgreich');

-- leads
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  email text,
  phone_number text,
  schadenshoehe numeric,
  vorfall text,
  status public.lead_status NOT NULL DEFAULT 'neu',
  source text NOT NULL DEFAULT 'csv',
  external_id text UNIQUE,
  raw jsonb,
  imported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage leads" ON public.leads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- lead_notes
CREATE TABLE public.lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_notes TO authenticated;
GRANT ALL ON public.lead_notes TO service_role;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage lead_notes" ON public.lead_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- lead_activity
CREATE TABLE public.lead_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_activity TO authenticated;
GRANT ALL ON public.lead_activity TO service_role;
ALTER TABLE public.lead_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage lead_activity" ON public.lead_activity FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX ON public.lead_notes(lead_id, created_at);
CREATE INDEX ON public.lead_activity(lead_id, created_at);
CREATE INDEX ON public.lead_activity(created_at DESC);

-- Triggers
CREATE OR REPLACE FUNCTION public.leads_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.leads_touch_updated_at();

CREATE OR REPLACE FUNCTION public.leads_log_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.lead_activity(lead_id, actor_id, action, details)
  VALUES (NEW.id, NEW.imported_by, 'imported', jsonb_build_object('source', NEW.source));
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_leads_log_insert AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.leads_log_insert();

CREATE OR REPLACE FUNCTION public.leads_log_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.lead_activity(lead_id, actor_id, action, details)
    VALUES (NEW.id, auth.uid(), 'status_changed',
      jsonb_build_object('from', OLD.status, 'to', NEW.status));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_leads_log_status AFTER UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.leads_log_status_change();

CREATE OR REPLACE FUNCTION public.lead_notes_log_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.lead_activity(lead_id, actor_id, action, details)
  VALUES (NEW.lead_id, NEW.author_id, 'note_added',
    jsonb_build_object('preview', left(NEW.content, 120)));
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_lead_notes_log_insert AFTER INSERT ON public.lead_notes
  FOR EACH ROW EXECUTE FUNCTION public.lead_notes_log_insert();
