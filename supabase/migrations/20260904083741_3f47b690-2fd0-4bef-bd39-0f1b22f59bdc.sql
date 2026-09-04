-- Telegram event for incoming chat messages
ALTER TYPE public.telegram_event ADD VALUE IF NOT EXISTS 'chat_message_received';

-- Presence field
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chat_active_at timestamptz;

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

-- Vic access
CREATE POLICY "Vics can select own chat messages"
ON public.chat_messages FOR SELECT TO authenticated
USING (vic_id = auth.uid());

CREATE POLICY "Vics can insert own chat messages"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (vic_id = auth.uid() AND sender_role = 'vic' AND sender_user_id = auth.uid());

CREATE POLICY "Vics can mark team messages read"
ON public.chat_messages FOR UPDATE TO authenticated
USING (vic_id = auth.uid())
WITH CHECK (vic_id = auth.uid());

-- Caller access (only assigned vics)
CREATE POLICY "Callers can select assigned chat messages"
ON public.chat_messages FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'caller')
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = chat_messages.vic_id AND p.assigned_caller_id = auth.uid())
);

CREATE POLICY "Callers can insert assigned chat messages"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'caller')
  AND sender_role = 'caller'
  AND sender_user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = chat_messages.vic_id AND p.assigned_caller_id = auth.uid())
);

CREATE POLICY "Callers can update assigned chat messages"
ON public.chat_messages FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'caller')
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = chat_messages.vic_id AND p.assigned_caller_id = auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'caller')
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = chat_messages.vic_id AND p.assigned_caller_id = auth.uid())
);

-- Admin access
CREATE POLICY "Admins can select chat messages"
ON public.chat_messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert chat messages"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update chat messages"
ON public.chat_messages FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete chat messages"
ON public.chat_messages FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Templates
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

CREATE POLICY "Team can select chat templates"
ON public.chat_templates FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'caller'));

CREATE POLICY "Admins can insert chat templates"
ON public.chat_templates FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update chat templates"
ON public.chat_templates FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete chat templates"
ON public.chat_templates FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;