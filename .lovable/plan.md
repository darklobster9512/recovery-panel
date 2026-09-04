# Telegram-Benachrichtigungen erweitern

Ziel: Neue und detailliertere Telegram-Benachrichtigungen für Livechat, To Dos und Termine. Zusätzlich zwei neue Ereignistypen (`todo_created`, `appointment_created_by_caller`) plus Detail-Anreicherung der bestehenden Ereignisse.

## Neue / geänderte Ereignisse

1. `chat_message_received` – anreichern (Caller-Name + volle Nachricht)
2. `todo_created` – neu
3. `todo_completed` – anreichern (Priorität + wer erstellt)
4. `appointment_booked` – anreichern (Vic-Name, Grund, Wer gebucht hat)
5. `appointment_created_by_caller` – neu (wenn Caller im Adminpanel selbst einen Termin anlegt)

## Beispiele wie die Telegram-Nachrichten aussehen

**Livechat (`chat_message_received`)**
```
💬 Neue Chat-Nachricht
👤 Vic: Max Mustermann
📧 max@example.com
📞 Caller: Julia Weber

Hallo, ich habe eine Frage zu meinem Auftrag bei der Deutschen Bank.
```
(Fallback „Kanzlei (Dr. Thomas Korte)", falls Vic keinem Caller zugewiesen ist.)

**To Do erstellt (`todo_created`)**
```
🆕 Neues To Do
📝 Vic Herr Schmidt zurückrufen
⚡ Priorität: Dringend
👤 Zugewiesen an: Julia Weber
🗓 Fällig: 05.09.2026

Bitte heute noch Rückruf durchführen, Vic wartet auf TAN.
```

**To Do abgeschlossen (`todo_completed`)**
```
✅ To Do abgeschlossen
📝 Vic Herr Schmidt zurückrufen
👤 Caller: Julia Weber
⚡ Priorität: Dringend
```

**Termin gebucht vom Vic (`appointment_booked`)**
```
📅 Neuer Termin gebucht
👤 Vic: Max Mustermann
📞 mit Julia Weber
🗓 05.09.2026 um 14:30 Uhr
```

**Termin vom Caller angelegt (`appointment_created_by_caller`)**
```
📅 Termin vom Caller eingetragen
📞 Caller: Julia Weber
👤 Vic: Max Mustermann
🗓 05.09.2026 um 14:30 Uhr
📝 Grund: Rückruf zur Auftragsklärung
```

## Technische Umsetzung

**Datenbank**
- Migration: `ALTER TYPE public.telegram_event ADD VALUE IF NOT EXISTS 'todo_created';`
- Migration: `ALTER TYPE public.telegram_event ADD VALUE IF NOT EXISTS 'appointment_created_by_caller';`

**Edge Function `_shared/telegram.ts`**
- Neue Cases `todo_created` und `appointment_created_by_caller`.
- `chat_message_received`: `caller_name` Feld ergänzen, `preview` bleibt volle Message.
- `todo_completed`: `priority` ergänzen.
- `appointment_booked`: `vic_name` immer anzeigen; `contact_name` bleibt.
- Neuen Cases-Text wie in Beispielen oben rendern.

**`telegram-notify/index.ts` + `src/lib/telegramNotify.ts`**
- Whitelist um die zwei neuen Event-Keys erweitern.
- TypeScript-Union `TelegramDbEvent` erweitern.

**`AdminTelegram.tsx`**
- Zwei neue Einträge in Event-Liste: „Neues To Do erstellt", „Termin vom Caller eingetragen".

**Call Sites**
- `src/components/chat/ChatWidget.tsx`: `caller_name` aus bereits geladenem Ansprechpartner (oder "Kanzlei (Dr. Thomas Korte)") mitschicken. Preview nicht mehr kürzen.
- `src/components/AdminTodos.tsx`:
  - Nach Insert eines neuen To Dos → `notifyTelegram("todo_created", { title, description, priority, caller_name, due_date })`.
  - In `toggleStatus` bei Abschluss zusätzlich `priority` mitgeben.
- `src/components/AdminAppointments.tsx`:
  - Wenn `role === "caller"`: Event `appointment_created_by_caller` mit `caller_name`, `vic_name`, `appointment_date`, `appointment_time`, `reason`.
  - Wenn `role === "admin"`: weiterhin `appointment_booked` mit Vic-Name.
- `src/components/BookingPanel.tsx` (Vic bucht selbst): `vic_name` mitschicken (aus Profil laden).

**Formatierung**
- Deutsche Datumsanzeige `DD.MM.YYYY`, Uhrzeit `HH:MM`.
- Priorität: `normal` → "Normal", `dringend` → "Dringend".
- HTML-Escaping über bestehende `esc`-Helper.

## Nicht enthalten
- Kein Nachtragen von Alt-Subscriptions – Admin muss die zwei neuen Events in `/admin/telegram` selber aktivieren.
