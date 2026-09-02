# Einstellungen-Reiter mit Branding, Resend & seven.io

Neuer Reiter `/admin/einstellungen` im Admin-Panel. Alle Werte – auch API-Keys – werden im Klartext in der Datenbank gespeichert (auf ausdrücklichen Wunsch). Änderungen wirken sich sofort auf E-Mail-Vorlage aus, und beim Anlegen eines Vic-Kontos werden E-Mail (Resend) und Kurz-SMS (seven.io) verschickt. Zusätzlich Tab „SMS Vorlagen" mit variablenbasiertem Text.

## Datenbank

Neue Tabelle `public.app_settings` (Singleton), Zugriff nur für Admins (auch lesen), weil sie API-Keys im Klartext enthält.

Felder:
- Branding: `company_name`, `street`, `city`, `phone`, `email`, `lawyer`, `vat_id`, `website`, `panel_subprefix`
- Resend: `resend_api_key`, `resend_from_name`, `resend_from_email`
- seven.io: `sevenio_api_key`, `sevenio_from_name`

Seed:
- Korte & Partner / Domstraße 15 / 20095 Hamburg / 040 573086460 / info@korte-kanzlei.de / Dr. Thomas Korte / DE317391938 / korte-kanzlei.de / web
- Integrations-Felder leer

Neue Tabelle `public.sms_templates_config` (Key/Content), Admin-only. Seed `credentials` mit Default-Text und Variablen `{{first_name}}`, `{{last_name}}`, `{{company_name}}`, `{{email}}`.

RLS: Beide Tabellen — SELECT/INSERT/UPDATE nur für Admins; service_role für Edge Functions.

## Frontend

Neuer Sidebar-Eintrag „Einstellungen" (`/admin/einstellungen`) mit Tabs:
1. **Branding** – Formular mit allen Branding-Feldern → schreibt `app_settings`.
2. **Integrationen** – Resend (API-Key, Absendername, Absendermail) und seven.io (API-Key, Absendername) als normale Textfelder (mit Show/Hide-Toggle für Keys).
3. **SMS Vorlagen** – Textarea für Template `credentials` inkl. Variablen-Hilfe.

`src/lib/emailTemplates.ts` bekommt Branding via Settings-Objekt (kein Hardcode). `AdminEmailTemplates.tsx` lädt `app_settings` per Query, rendert Preview live, „Jetzt anmelden"-Link zeigt auf `https://{panel_subprefix}.{website}/auth`.

## Vic-Erstellung: E-Mail + SMS

Edge Function `create-user` erweitert:
- Nach `auth.admin.createUser` liest sie `app_settings` und `sms_templates_config` per Service-Role.
- Rendert E-Mail über gemeinsames Modul `supabase/functions/_shared/emailTemplate.ts` (Duplikat der Frontend-Logik) und sendet per Resend (`POST https://api.resend.com/emails`) mit den DB-gespeicherten Zugangsdaten.
- Rendert SMS-Text aus `sms_templates_config.credentials` (verkürzt, keine Login-Daten) und sendet per seven.io (`POST https://gateway.seven.io/api/sms`) an die Telefonnummer.
- Versandfehler werden geloggt und im Response mitgegeben, brechen die Kontoerstellung aber nicht ab.
- Fällt weg, wenn die entsprechenden Felder in `app_settings` leer sind (mit Hinweis im Response).

## Betroffene Dateien

- Migration: `app_settings`, `sms_templates_config` inkl. GRANTs, RLS, Trigger, Seed.
- Neu: `src/components/AdminSettings.tsx`, `src/lib/settings.ts` (Typen + Query-Helper), `supabase/functions/_shared/emailTemplate.ts`.
- Anpassung: `src/lib/emailTemplates.ts` (Branding als Argument), `src/components/AdminEmailTemplates.tsx` (Settings-Query, Login-URL aus Subprefix+Website), `src/App.tsx` + `src/pages/AdminPanel.tsx` (Route + Sidebar), `supabase/functions/create-user/index.ts` (Resend + seven.io Versand).
