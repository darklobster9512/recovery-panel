# Backup-System aktualisieren

## Ist-Zustand
- Das Backup findet alle Tabellen automatisch, neue Tabellen (Brandings, verknüpfte Caller-Konten, Verifikations-Anfragen und ihre Ergebnisse, Todos usw.) sind also schon mit drin. Die Anmeldekonten sind auch dabei.
- Es fehlen: **Dateien** (Ausweise, Dokumente, Chat-Anhänge, Caller-Profilbilder, Verifikations-Logos), eine **Aufteilung nach Marke** und Angaben dazu, mit welchem Datenbankstand das Backup erstellt wurde.
- Beim Import werden Tabellen einzeln eingespielt. Dabei gibt es keinen Gesamtbericht und keine Prüfung, ob die Datei zum aktuellen Stand passt.

## Was gebaut wird

### 1. Vollständiges Backup (stündlich an Telegram, wie bisher)
- Eine ZIP mit allen Tabellen, sortiert nach Abhängigkeit (Marken → Profile → Vics → Aufträge → …).
- Neu: Ordner `files/` mit allen Dateien aus den 4 Speicherbereichen. Falls die ZIP für Telegram zu groß wird (über 50 MB), werden die Dateien als eigene ZIP-Teile mitgeschickt (`dateien-1.zip`, `dateien-2.zip` …).
- Neu: Eine Übersicht in der ZIP mit Version 2, Erstellzeit, Liste der Marken, Einträgen pro Tabelle und Einträgen pro Marke.

### 2. Backup pro Marke
- Zusätzlich kommt pro Marke eine eigene ZIP, z. B. `backup-korte-partner-….zip` und `backup-berthold-partner-….zip`. Sie enthält nur die Daten dieser Marke: ihre Leads, Vics, Caller, Telefonnummern und alles, was an diesen Vics hängt (Aufträge, Dokumente, Chats, Termine, Notizen, Anfragen, Ergebnisse) samt Dateien.
- Globale Daten (Einstellungen, Vorlagen, Verifikations-Bänke, Telegram-Chats) liegen in jeder Marken-ZIP mit drin, damit sich jede Datei für sich einspielen lässt.
- Unter Einstellungen → Backups lässt sich wählen: „Alles“ oder eine Marke (manueller Export und Telegram-Versand).

### 3. Import, der zuverlässig klappt
- Vorschau vor dem Einspielen: Version, Marken, Tabellen, Anzahl Einträge, Dateien. Es gibt einen Hinweis, wenn die Datei Tabellen oder Spalten enthält, die es nicht mehr gibt, oder wenn neue Felder fehlen (diese bekommen ihre Standardwerte).
- Die Reihenfolge ist immer: Anmeldekonten → Marken → Profile und Rollen → Leads → alles Weitere → Dateien hochladen.
- Beim Einspielen werden keine Telegram-Nachrichten, SMS oder Aktivitätseinträge ausgelöst (wie bisher).
- Modus „Ergänzen“ (vorhandene Einträge bleiben) oder „Überschreiben“ (Einträge mit gleicher ID werden ersetzt). Beim Marken-Import gilt „Überschreiben“ nur für Einträge dieser Marke.
- Am Ende steht ein Bericht: pro Tabelle eingespielt, übersprungen und fehlerhaft, außerdem die Anzahl hochgeladener Dateien. Fehler in einer Tabelle brechen den Import nicht ab, sondern stehen im Bericht.
- Alte Backups (Version 1) lassen sich weiterhin einspielen, dann eben ohne Dateien.

### 4. Nicht im Backup (bewusst)
- Geheimschlüssel des Servers (z. B. der Telegram-Bot-Token) und das interne Backup-Passwort. Die Zugangsdaten für Resend und seven.io pro Marke sind als Teil der Markendaten enthalten.

## Technische Details
- `admin-backup`: neue Aktionen `manifest`, `export_brand` (Filter über `branding_id` bzw. über die Vic-IDs der Marke, abgeleitet aus den Fremdschlüsseln auf `profiles` / `leads` / `verification_requests` / `todos` und Caller-IDs), `list_files` / `export_file` / `import_file` (Storage über den Service-Client). Import mit `session_replication_role = replica`, Reihenfolge per Topo-Sort, außerdem `auth.users` und `auth.identities` zuerst; Bericht pro Tabelle.
- Telegram-Versand: eine ZIP für alles plus eine pro Marke, Aufteilung in mehrere Teile über 45 MB (sendDocument-Limit).
- Frontend `AdminSettings` (Reiter Backups): Auswahl der Marke, Vorschau-Dialog, Fortschritt, Ergebnisbericht.
- Test: Vitest für die Regel, welche Tabelle einer Marke zugeordnet wird, und für die Import-Reihenfolge. Danach ein echter Export → Import mit „Ergänzen“ zur Prüfung.
