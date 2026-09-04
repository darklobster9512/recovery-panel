# Fallback „Dr. Thomas Korte" im Livechat ohne Caller

Wenn ein Vic keinem Caller zugewiesen ist, wird der Chat als Chat mit der Kanzlei (Dr. Thomas Korte) geführt — nur Admins sehen und beantworten diese Chats.

## Vic-Dashboard

Das Widget zeigt bereits ohne Zuweisung Dr. Thomas Korte mit Bild. Ergänzung:
- Unterzeile im Chat-Kopf: „Kanzlei Korte & Partner" statt nur „Ihr Ansprechpartner", wenn kein Caller zugewiesen ist.
- Nachrichten vom Team ohne `as_caller_id` werden weiterhin als Nachricht des Ansprechpartners dargestellt (keine Änderung nötig).

## Admin-Livechat (`/admin/livechat`)

- Konversationsliste: Chats ohne Caller werden mit Label „Dr. Thomas Korte (Kanzlei)" statt „Kein Caller zugewiesen" gekennzeichnet.
- Die Liste wird für Caller zusätzlich clientseitig auf `assigned_caller_id = eigene ID` gefiltert, sodass unzugewiesene Chats nur Admins erreichen.
- „Antworten als": Option `self` wird zu „Dr. Thomas Korte (Kanzlei)". Bei Vics ohne Caller ist das die Vorauswahl (bereits so), bei Vics mit Caller bleibt der zugewiesene Caller Standard.
- Senden bleibt unverändert: `sender_role = 'admin'`, `as_caller_id = null` für Kanzlei-Antworten.

## Technische Details

Betroffene Dateien:
- `src/components/AdminLivechat.tsx`: Filter in `loadConvs` für Caller-Rolle, Label in der Liste, Select-Option-Text.
- `src/components/chat/ChatWidget.tsx` / `src/pages/Dashboard.tsx`: Untertitel im Chat-Kopf per neuem optionalen Prop (z. B. `contactSubtitle`).

Keine Migration nötig — Datenmodell und RLS bleiben unverändert.
