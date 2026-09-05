# Telegram-Benachrichtigungen direkt beim SMS-Empfang & Weiterleitung

## Ziel
Kein komplizierter Umbau. Genau zwei Auslöser lösen jeweils sofort eine Telegram-Nachricht aus:

1. **Neue SMS von Anosim erkannt** → `anosim_sms_received`
2. **TAN erfolgreich an Vic weitergeleitet** → `tan_forwarded_to_vic`

Egal ob der Browser-Poll (`anosim-proxy`) oder der Cron-Sweep (`forward-tan-sweep`) die SMS zuerst sieht — beide Wege gehen durch dieselbe Stelle und feuern dieselben Notifications.

## Umsetzung

Alles passiert in **einer** Datei: `supabase/functions/_shared/forwardTan.ts` (die gemeinsame Funktion `processAssignmentForward`, die beide Aufrufer nutzen).

Direkt nachdem eine neue SMS in `forwarded_sms` gespeichert wurde:
- Notification `anosim_sms_received` senden (Vic-Name, Auftrag, Absender, Text).
- Falls TAN extrahiert und per seven.io versendet: Notification `tan_forwarded_to_vic` senden (Vic-Name, Ziel-Nummer, Auftrag, Code).

Vic-Name und Auftrags-Titel werden einmal pro Aufruf aus `profiles` + `verifications` geladen.

Alter, doppelter Telegram-Block in `anosim-proxy/index.ts` wird entfernt, damit es nicht doppelt sendet.

Telegram-Fehler werden nur geloggt — die Weiterleitung selbst bricht nie ab.

## Nicht Teil des Plans
- Kein neuer Event-Typ, keine neue Subscription.
- Kein Cron-, RLS- oder Frontend-Änderung.
- Verpasste SMS aus der Vergangenheit werden nicht nachgesendet.
