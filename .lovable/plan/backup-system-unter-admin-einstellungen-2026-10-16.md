# Backup-System unter /admin/einstellungen

## Was du bekommst
Neuer Reiter **„Backups"** in den Einstellungen:
- **Backup jetzt erstellen** – lädt alle Tabellen (alle Daten inkl. Benutzerkonten/Logins) als ZIP herunter, mit Fortschrittsanzeige.
- **Backup wiederherstellen** – ZIP hochladen, Modus „Ergänzen" (nur Fehlendes einfügen) oder „Überschreiben", danach Bericht pro Tabelle.
- **Automatische Backups per Telegram** – Feld für die Telegram-Chat-ID, Schalter an/aus, Button „Test-Backup jetzt senden", Anzeige „Letztes Backup: …" bzw. letzter Fehler.
- Stündlich wird automatisch ein Backup erstellt und als ZIP-Datei vom bestehenden Bot an diesen Chat geschickt.

Nur Admins können das sehen und nutzen.

## Hinweise
- Gesichert werden alle Datenbankeinträge. Hochgeladene Dateien (Ausweisbilder, PDFs, Avatare) sind nicht in der ZIP – nur ihre Verweise. Telegram erlaubt max. 50 MB pro Datei; wird das überschritten, kommt eine Fehlermeldung in den Chat.
- Das Backup enthält Logins und Zugangsdaten – der Telegram-Chat sollte privat sein.
- Läuft 24× am Tag; bei ausgeschaltetem Schalter passiert nichts.

## Technische Details
- Edge Function `admin-backup` (Port aus Referenzprojekt): Aktionen `list`, `export`, `import` über `SUPABASE_DB_URL` + postgres-Client, Tabellen `public.*` + `auth.users`/`auth.identities`, FK-sortiert. Admin-Check per `has_role`.
- Neue Aktion `telegram`: exportiert alles serverseitig, baut ZIP (jszip via npm), `sendDocument` mit `TELEGRAM_BOT_TOKEN` an gespeicherte Chat-ID. Aufrufbar von Admin oder vom Cron mit geheimem Token (`backup_cron_token` in neuer Tabelle, nicht im Client lesbar).
- Migration: Spalten in `app_settings`: `backup_telegram_chat_id text`, `backup_enabled bool`, `backup_last_at`, `backup_last_error`. Separate Tabelle `backup_secrets` (nur service_role) für den Cron-Token.
- pg_cron + pg_net Job `hourly-backup` (`0 * * * *`) ruft die Funktion mit Token auf; Funktion prüft `backup_enabled` vorher.
- Frontend: `src/components/AdminBackups.tsx` (jszip im Client) + neuer Tab in `AdminSettings.tsx`; `verify_jwt=false` für `admin-backup` in config.toml.
