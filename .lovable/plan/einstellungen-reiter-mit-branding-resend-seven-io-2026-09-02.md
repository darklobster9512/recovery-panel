# Einstellungen-Reiter mit Branding, Resend & seven.io

Neuer Reiter `/admin/einstellungen` im Admin-Panel, in dem Branding-Daten, Resend-Zugangsdaten und seven.io-Zugangsdaten zentral gepflegt werden. Änderungen wirken sich automatisch auf die E-Mail-Vorlage aus, und beim Anlegen eines Vic-Kontos werden E-Mail (Resend) und Kurz-SMS (seven.io) versendet. Zusätzlich neuer Reiter „SMS Vorlagen" mit variablenbasiertem Text.

## Datenbank

Neue Tabelle `public.app_settings` (Singleton mit fester `id`), gepflegt nur durch Admins:

Branding-Felder:
- Unternehmensname, Straße & Hausnummer, PLZ & Stadt, Telefonnummer, Email, Anwalt, UstId, Website, Panel-Subprefix

Initialer Seed:
- Korte & Partner / Domstraße 15 / 20095 Hamburg / 040 573086460 / info@korte-kanzlei.de / Dr. Thomas Korte / DE317391938 / korte-kanzlei.de / web

Neue Tabelle `public.sms_templates_config` (Singleton je Template-Key). Erster Eintrag: `credentials` mit Default-Text unter Verwendung von `{{first_name}}`, `{{last_name}}`, `{{login_url}}`, `{{company_name}}`.

Secrets (nicht in DB) via `add_secret`:
- `RESEND_API_KEY`, `RESEND_FROM_NAME`, `RESEND_FROM_EMAIL`
- `SEVENIO_API_KEY`, `SEVENIO_FROM_NAME`

Grund: API-Keys gehören nicht in die DB. Die Einstellungsseite bietet Eingabefelder, die per Edge Function `update-integration-secrets` in die Supabase-Secrets geschrieben werden (admin-only). Angezeigt wird nur, ob ein Wert gesetzt ist.

RLS: `SELECT` für authenticated (nur Branding – Keys stehen sowieso nicht drin), `INSERT/UPDATE` nur für Admin. `sms_templates_config` gleich.

## Frontend

Neuer Sidebar-Eintrag „Einstellungen" (`/admin/einstellungen`) mit Tabs:
1. Branding – Formular für alle Branding-Felder, Speichern schreibt in `app_settings`.
2. Integrationen – Resend (API-Key, Absendername, Absendermail) & seven.io (API-Key, Absendername). Werte werden write-only per Edge Function gesetzt; Status „gesetzt/nicht gesetzt".
3. SMS Vorlagen – Textarea für Template `credentials` mit Variablen-Hilfe (`{{first_name}}` …).

`src/lib/emailTemplates.ts` liest Branding aus einem übergebenen Settings-Objekt (kein Hardcode mehr). `AdminEmailTemplates.tsx` lädt `app_settings` per Query, generiert die Preview live und setzt den „Jetzt anmelden"-Link auf `https://{panel_subprefix}.{website}/auth`.

## Vic-Erstellung: E-Mail + SMS

Edge Function `create-user` erweitert:
- Nach erfolgreicher Nutzeranlage lädt sie `app_settings` + `sms_templates_config` (service role).
- Rendert die E-Mail via gemeinsamem Template-Modul (`_shared/emailTemplate.ts`) und sendet über Resend (`POST https://api.resend.com/emails`) an den neuen Nutzer.
- Rendert den SMS-Text (verkürzt, ohne Login-Daten) mit Variablen aus DB-Template und sendet über seven.io (`POST https://gateway.seven.io/api/sms`).
- Fehler beim Versand werden geloggt und im Response mitgegeben, brechen die Kontoerstellung aber nicht ab.

## Technische Details

- Neue Dateien: `src/components/AdminSettings.tsx`, `src/components/AdminSmsTemplates.tsx`, `src/lib/settings.ts` (Typen + Query-Helper), `supabase/functions/_shared/emailTemplate.ts` (dupliziert Logik aus `src/lib/emailTemplates.ts`), `supabase/functions/update-integration-secrets/index.ts`.
- Migration erstellt Tabellen inkl. GRANTs, RLS, Update-Trigger, Seed-Row.
- `src/App.tsx` + `src/pages/AdminPanel.tsx`: Routen `/admin/einstellungen` und `/admin/sms-vorlagen` (letztere alternativ als Tab innerhalb Einstellungen – siehe UI oben, empfohlen als Tab).
- `create-user` bekommt neue Env-Vars und ruft Resend/seven.io per `fetch` auf.
- Bestehende Hardcoded-Footer-Zeilen in `src/lib/emailTemplates.ts` entfallen; Werte kommen aus `app_settings`.
