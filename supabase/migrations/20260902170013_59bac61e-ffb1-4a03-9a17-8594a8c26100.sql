
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
  'lead_note_added',
  'vic_note_added',
  'document_uploaded',
  'assignment_created',
  'assignment_completed',
  'anosim_sms_received',
  'user_account_created',
  'tan_forwarded_to_vic'
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
