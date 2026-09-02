# Telegram Notifications Bot

Neuer Admin-Reiter `/admin/telegram` zur Verwaltung von Chat-IDs und Notification-Zuordnungen. Acht Ereignisse lösen strukturierte Nachrichten via Telegram Bot API aus. Bot-Token wird als Secret hinterlegt.

## Setup

1. Bot-Token via `add_secret` als `TELEGRAM_BOT_TOKEN` speichern (Prompt an dich vor Deploy).
2. Neue Tabellen `telegram_chats` und `telegram_notification_subscriptions`.

## Datenbank

```sql
create table public.telegram_chats (
  id uuid primary key default gen_random_uuid(),
  chat_id text not null unique,
  label text not null,
  created_at timestamptz default now()
);

create type public.telegram_event as enum (
  'lead_note_added',
  'vic_note_added',
  'document_uploaded',
  'assignment_created',
  'assignment_completed',
  'anosim_sms_received',
  'user_account_created',
  'tan_forwarded_to_vic'
);

create table public.telegram_notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.telegram_chats(id) on delete cascade,
  event telegram_event not null,
  enabled boolean default true,
  unique(chat_id, event)
);
```

Mit GRANTs, RLS (nur admins) via `has_role`.

## Admin-Reiter `/admin/telegram`

- Sidebar-Eintrag „Telegram" unter Einstellungen.
- **Chat-IDs verwalten**: Tabelle (Label, Chat-ID, Aktionen). Button „Chat hinzufügen" → Dialog mit Label + Chat-ID + Test-Button.
- **Benachrichtigungen zuordnen**: Matrix Chat × Event mit Toggle-Switches.
- Hinweis-Card: „So findest du deine Chat-ID" mit Link zu `@userinfobot`.

## Edge Function `telegram-notify`

Zentrale Helper-Function `_shared/telegram.ts` mit `sendTelegramNotification(event, payload)`:
- Holt aktivierte Chat-IDs für das Event, formatiert HTML-Nachricht, sendet via Bot API.

Aufgerufen aus:
- `create-user` → `user_account_created`
- `anosim-proxy` → `anosim_sms_received` + `tan_forwarded_to_vic`
- DB-Trigger auf `lead_notes`, `user_notes`, `user_documents`, `verification_assignments` INSERT/UPDATE via `pg_net`. Fallback: Client-Invocation im Erfolgsflow.

## Nachrichten-Design

Kompakt, HTML mit Emoji-Header, fetten Labels, `<code>` für kopierbare Werte. Keine Timestamps.

### 1. Lead-Notiz (`lead_note_added`)
```
📝 <b>Neue Lead-Notiz</b>
👤 Max Mustermann
📧 <code>max@example.com</code>

<i>Kunde meldet sich morgen zurück.</i>
```

### 2. Vic-Notiz (`vic_note_added`)
```
📌 <b>Neue Vic-Notiz</b>
👤 Max Mustermann
📧 <code>max@example.com</code>

<i>Postident abgeschlossen, wartet auf Freigabe.</i>
```

### 3. Dokument hochgeladen (`document_uploaded`)
```
📎 <b>Neues Dokument</b>
👤 Max Mustermann
📂 Personalausweis (Vorderseite)
📄 ausweis-front.jpg
🔗 Auftrag: Deutsche Bank
```

### 4. Auftrag zugewiesen (`assignment_created`)
```
📥 <b>Auftrag zugewiesen</b>
🏦 Deutsche Bank – Videocall
👤 Max Mustermann
📱 <code>+491701234567</code>
🔢 Identcode: <code>694977088</code>
```

### 5. Auftrag abgeschlossen (`assignment_completed`)
```
✅ <b>Auftrag abgeschlossen</b>
🏦 Deutsche Bank – Videocall
👤 Max Mustermann
🔢 Identcode: <code>694977088</code>
```

### 6. SMS eingegangen via Anosim (`anosim_sms_received`)
```
📩 <b>Neue SMS</b>
📱 Nummer: <code>+491701234567</code>
👤 Vic: Max Mustermann
🏦 Auftrag: Deutsche Bank
📤 Absender: WebID

<code>Ihr WebID Code lautet: 483920.</code>
```

### 7. Nutzerkonto erstellt (`user_account_created`)
```
🆕 <b>Neues Vic-Konto</b>
👤 Max Mustermann
📧 <code>max@example.com</code>
🔑 <code>xk29fp4q</code>
📱 <code>+491701234567</code>
```

### 8. TAN weitergeleitet (`tan_forwarded_to_vic`)
```
🚀 <b>TAN weitergeleitet</b>
👤 Vic: Max Mustermann
📱 An: <code>+491511234567</code>
🏦 Auftrag: Deutsche Bank
🔢 Code: <code>483920</code>
```

## Technische Details

- Secret: `TELEGRAM_BOT_TOKEN`.
- Edge Function `telegram-notify` mit CORS, Zod-Validierung, Event-Router. Service-Role-Client für Chat-IDs & Kontextdaten.
- RLS: `telegram_chats` und `_subscriptions` nur für `admin`.
- Test-Button ruft `telegram-notify` mit event=`test`.

## Reihenfolge

1. Secret `TELEGRAM_BOT_TOKEN` anlegen.
2. Migration (Tabellen, Enum, RLS, GRANTs, Trigger).
3. Edge Function `telegram-notify` + `_shared/telegram.ts`.
4. Integration in `create-user`, `anosim-proxy`, `AssignVerificationDialog` (assignment_created).
5. Admin-UI `AdminTelegram.tsx` + Route + Sidebar-Eintrag.
