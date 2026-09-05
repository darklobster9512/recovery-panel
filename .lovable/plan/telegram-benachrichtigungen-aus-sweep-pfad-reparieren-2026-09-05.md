# Telegram-Benachrichtigungen aus Sweep-Pfad reparieren

## Diagnose (bestätigt)

- Telegram-Notifications für `anosim_sms_received` und `tan_forwarded_to_vic` werden ausschließlich in `supabase/functions/anosim-proxy/index.ts` verschickt — und nur, wenn der Proxy mit `assignmentId` aufgerufen wird (Vic-Dashboard-Polling).
- `supabase/functions/_shared/forwardTan.ts` markiert verarbeitete SMS in `forwarded_sms` — sendet aber selbst keine Telegram-Nachricht.
- `supabase/functions/forward-tan-sweep/index.ts` läuft alle 15 Sekunden per `pg_cron`, ruft `processAssignmentForward` auf und leitet die TAN per seven.io weiter — verschickt aber ebenfalls keine Telegram-Nachricht.
- Ergebnis: Wenn der Sweep die SMS zuerst sieht (z. B. weil der Vic gerade nicht im Dashboard ist), wird die TAN korrekt per SMS weitergeleitet, aber es geht keine Telegram-Notification raus. Genau das passierte bei Michael Himmler; bei anderen Vics (z. B. Annette Schmitt) hat zufällig der Browser-Poll die SMS zuerst gesehen, deshalb kam dort die Notification.

Für Himmler sind vier SMS in `forwarded_sms` gespeichert (u. a. `2026-09-05T12:39:27.973Z`, `12:41:38.033Z`), Abos für beide Events sind aktiv — der Sweep hat sie stumm verarbeitet.

## Fix

Notifications aus dem Sweep-/Proxy-abhängigen Aufrufer heraus **in die geteilte Funktion** verlagern, damit sie **immer direkt** ausgelöst werden — egal ob Sweep oder Proxy die SMS zuerst sieht.

### `supabase/functions/_shared/forwardTan.ts`
- Neuer interner Loader für Vic-Name + Verification-Titel (analog `loadAssignmentContext` im Proxy).
- Für jede als neu erkannte SMS direkt `sendTelegramNotification("anosim_sms_received", …)` aufrufen.
- Für jede per seven.io erfolgreich weitergeleitete TAN direkt `sendTelegramNotification("tan_forwarded_to_vic", …)` aufrufen.
- Fehler beim Telegram-Versand nur loggen; TAN-Weiterleitung bleibt unberührt.
- Reihenfolge: erst `forwarded_sms` in der DB updaten (Idempotenz), danach Notifications senden.

### `supabase/functions/anosim-proxy/index.ts`
- Doppelten Telegram-Block entfernen — die Notifications kommen jetzt aus dem Shared-Modul.
- Restlicher Ablauf (Auth, Anosim-Fetch, Response) unverändert.

### `supabase/functions/forward-tan-sweep/index.ts`
- Keine Codeänderung nötig — profitiert automatisch von den Notifications im Shared-Modul.

## Nicht enthalten

- Keine Änderungen am Cron-Zeitplan, an den Abonnements, am Event-Katalog oder am Frontend.
- Keine Nachrüstung der bereits verpassten Himmler-SMS.
