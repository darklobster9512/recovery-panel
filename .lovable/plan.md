# Livechat für Vics, Caller und Admins

Baut das Livechat-System aus dem Referenzprojekt `vic-automation` nach und passt es auf die Korte-Struktur an: jeder Vic hat genau einen Chat mit seinem zugewiesenen Ansprechpartner (Caller). Caller sehen nur ihre zugewiesenen Vics, Admins sehen alle Chats und können im Namen der Caller antworten.

## Umfang

**Dashboard (Vic)**
- Chat-Widget unten rechts (Bubble → Panel, mobil Fullscreen-Sheet), analog Referenz.
- Kopfzeile zeigt Name + Avatar des zugewiesenen Ansprechpartners. Ohne Zuweisung Fallback auf Dr. Thomas Korte.
- Ungelesen-Badge, Ton- und Browser-Notification bei neuer Nachricht, Datei-/Bild-Anhänge, Tippanzeige.
- Wenn `member_status = 'in_bearbeitung'` (kein Perso hochgeladen): Widget zeigt Hinweis „Chat wird nach Verifizierung freigeschaltet" und ist gesperrt. Sonst voll nutzbar.

**Admin-Panel: neuer Reiter `/admin/livechat`**
- Linke Conversation-Liste (Suche, Sortierung nach letzter Nachricht, Ungelesen-Badge, Filter „Nur meine" für Caller-Rolle).
- Rechte Chatansicht mit Nachrichten, Anhängen, Templates (Shortcodes), optionaler AI-Vorschlag/Politur-Leiste (nutzt bestehendes `LOVABLE_API_KEY`).
- Admins können pro Chat auswählen „Antworten als: [Caller X]"; Standard ist der zugewiesene Caller. Nachricht wird mit dessen Identität (Name/Avatar) beim Vic angezeigt.
- Caller sehen nur Chats, in denen sie zugewiesen sind; keine Auswahl der Absenderidentität.
- Nachrichten als gelesen markieren beim Öffnen.

**Telegram-Event**: neues Event `chat_message_received` (Vic → Team), analog zu bestehenden Notifications, in `AdminTelegram` konfigurierbar.

## Datenmodell (Migration)

Konversation = Vic-Profil. Kein separates `conversations`-Table nötig; Schlüssel ist `vic_id` (= `profiles.id`).

```sql
CREATE TABLE public.chat_messages (
  id uuid PK,
  vic_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('vic','caller','admin','system')),
  sender_user_id uuid REFERENCES auth.users(id),   -- tatsächlicher Autor
  as_caller_id uuid REFERENCES auth.users(id),     -- gesetzt wenn Admin im Namen eines Callers postet
  content text NOT NULL,
  attachment_url text,
  attachment_type text,
  read_at_vic timestamptz,
  read_at_team timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON chat_messages(vic_id, created_at);

CREATE TABLE public.chat_templates (
  id uuid PK, shortcode text UNIQUE, content text, created_at timestamptz
);

-- profiles: chat_active_at (Presence für Vic), typing_at (kurzzeitig)
ALTER TABLE profiles ADD COLUMN chat_active_at timestamptz;
```

- GRANTs für `authenticated` + `service_role`.
- RLS:
  - Vic: SELECT/INSERT wo `vic_id = auth.uid()`; INSERT nur mit `sender_role='vic'`.
  - Caller: SELECT/INSERT/UPDATE wo `profiles.assigned_caller_id = auth.uid()`; INSERT nur mit `sender_role='caller'` und `sender_user_id=auth.uid()`.
  - Admin: alle SELECT/INSERT/UPDATE; darf `as_caller_id` setzen.
  - `chat_templates`: nur Admin+Caller lesen, nur Admin schreiben.
- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;`
- Storage: neuer privater Bucket `chat-attachments`, Policies analog `user-documents`.

## UI/Code

Aus dem Referenzprojekt adaptieren (nicht 1:1 kopieren, weil dortiges Schema `contract_id`/Brandings nutzt):
- `src/components/chat/ChatWidget.tsx` — Vic-Widget.
- `src/components/chat/AdminChatPanel.tsx` (aus `AdminLivechat.tsx`) — Conversation-Liste + Chat.
- Hilfs-Hooks/Bausteine: `ChatBubble`, `ChatInput`, `useChatRealtime`, `useChatTyping`, `useChatSounds`, `uploadChatAttachment`, `TemplateDropdown`, `TemplateManager`, `AiSuggestionBar`.
- `src/pages/Dashboard.tsx`: `<ChatWidget />` einbinden, Ansprechpartner-Card + Widget teilen sich dieselbe Caller-Resolution.
- `src/pages/AdminPanel.tsx`: neuer Nav-Eintrag „Livechat" (für admin+caller), Seite `/admin/livechat`.
- `src/App.tsx`: Route hinzufügen.
- Edge Function `ai-chat-suggest` optional (Lovable AI Gateway) — Standard: erstmal weglassen, nur Templates.

## Telegram

- Neuer Enum-Wert `chat_message_received` in `telegram_event`.
- `lib/sendTelegram`-Hook nach jedem Vic-Insert (Client-seitig nach erfolgreichem INSERT) mit Vic-Name + Vorschau.

## Reihenfolge

1. Migration (Tabellen, RLS, Grants, Realtime, Bucket, Enum).
2. Shared Chat-Komponenten + Hooks portieren/schlank halten.
3. `ChatWidget` im Dashboard.
4. `/admin/livechat` mit Conversation-Liste + „Antworten als".
5. Templates-Verwaltung (klein) im Admin-Livechat.
6. Telegram-Event.
7. Build + TypeScript-Check.

## Offene Punkte (mit Vorschlag)

- **AI-Vorschläge/Politur**: erstmal weglassen, nur Templates. Später nachrüstbar.
- **Anhänge**: Bilder + PDF erlaubt, max 10 MB.
- **Vic ohne Perso**: Widget gesperrt mit Hinweis.
- **Sounds**: leises Ping bei neuer Nachricht (an/aus über LocalStorage).

Sag Bescheid, wenn eine dieser Vorgaben anders sein soll — sonst setze ich sie so um.
