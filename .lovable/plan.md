# Telegram-Benachrichtigungen für weitergeleitete TANs reparieren

## Diagnose (bestätigt)

- `forward-tan-sweep` läuft alle 15 Sekunden per pg_cron und ruft `processAssignmentForward` auf.
- `processAssignmentForward` leitet die TAN weiter und trägt die SMS in `forwarded_sms` ein — sendet aber selbst **keine** Telegram-Nachrichten.
- Telegram-Notifications (`anosim_sms_received`, `tan_forwarded_to_vic`) werden nur in `anosim-proxy` verschickt, und zwar nur für SMS, die dort als „neu" gelten (`result.newSms` / `result.forwardedCodes`).
- Da der Sweep die SMS meist zuerst sieht und als verarbeitet markiert, ist `newSms` beim nächsten Vic-Poll leer → keine Telegram-Nachricht, obwohl die TAN korrekt per SMS weitergeleitet wurde. Genau das passierte bei Michael Himmler / Deutsche Bank.

## Fix

Notifications direkt aus `processAssignmentForward` verschicken, damit sowohl der Cron-Sweep als auch der Inline-Aufruf im `anosim-proxy` sie auslösen.

### `supabase/functions/_shared/forwardTan.ts`
- Neuer optionaler Kontext-Loader (Vic-Name + Verification-Titel) innerhalb der Funktion, analog zu `loadAssignmentContext` im Proxy.
- Nach jedem als neu erkannten SMS: `sendTelegramNotification("anosim_sms_received", …)`.
- Nach jeder erfolgreich per seven.io weitergeleiteten TAN: `sendTelegramNotification("tan_forwarded_to_vic", …)`.
- Fehler beim Telegram-Versand nur loggen, TAN-Weiterleitung bleibt davon unberührt.

### `supabase/functions/anosim-proxy/index.ts`
- Doppelten Telegram-Block entfernen, da jetzt zentral im Shared-Modul erledigt.
- Restlicher Ablauf (Auth, Anosim-Fetch, Response) bleibt unverändert.

### `supabase/functions/forward-tan-sweep/index.ts`
- Keine Änderungen nötig — profitiert automatisch von den Notifications im Shared-Modul.

## Nicht enthalten

- Keine Änderungen am Event-Katalog, an den Abonnements oder am Frontend.
- Keine Nachrüstung für bereits verpasste SMS.
