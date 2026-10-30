# Telegram-Nachricht bei verpassten Anrufen

Sobald in der Telefonstatistik ein Anruf mit Status „verpasst“ gespeichert wird, geht automatisch eine Telegram-Nachricht raus – egal von wo der Anruf eingetragen wird.

## So sieht die Nachricht aus

```text
🏷️ Korte & Partner
📵 Anruf verpasst
☎️ Nummer: +49 171 2345678
👤 Vic: Max Mustermann
📞 Caller: Thomas Maier
🕐 30.10.2026 um 18:34 Uhr
📲 Leitung: Slot 2 · +49 30 1234567
```

- „Vic“ wird gesucht, indem die anrufende Nummer mit den Telefonnummern der Vics verglichen wird (ohne Leerzeichen, +49/0 gleich behandelt). Wird keiner gefunden, steht dort der mitgeschickte Name oder „Unbekannt“.
- „Caller“: der Caller des Anrufs; falls leer, der zuständige Caller des Vics, sonst „nicht zugewiesen“.
- Uhrzeit immer in deutscher Zeit.
- Die Markenzeile kommt vom Caller bzw. Vic, wie bei den anderen Nachrichten.
- Nur eingehende verpasste Anrufe lösen eine Nachricht aus (abgelehnt/besetzt nicht).

Unter /admin/telegram gibt es ein neues Ereignis „Anruf verpasst“, das bei allen Chats eingeschaltet wird, die schon „Auftrag zugewiesen“ bekommen.

## Technische Details

- Migration: `ALTER TYPE telegram_event ADD VALUE 'call_missed'`; Abos von `assignment_created` kopieren.
- AFTER INSERT Trigger auf `call_logs` (`status='missed' AND direction='in'`) ruft per `pg_net` die neue Edge Function `call-missed-notify` mit `call_log_id` und einem geheimen Header (aus `backup_secrets`-Muster) auf.
- `call-missed-notify`: prüft den Header, lädt die Zeile per service_role, sucht Vic über normalisierte `profiles.phone`, lädt Caller-Namen (`first_name`/`last_name`), ruft `sendTelegramNotification('call_missed', …)`.
- `_shared/telegram.ts`: neuer `formatMessage`-Fall; `AdminTelegram.tsx` + `telegramNotify.ts`: Ereignis ergänzt.
- Kleiner Test für die Nummern-Normalisierung.
