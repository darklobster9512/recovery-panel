# "Ihr Fall bei Korte"-Email erneut versenden

Auf der Vic-Detailseite (`/admin/vics/:id`) kommt ein Button, der die Kontoerstellungs-Email (Betreff „Ihr Fall bei Korte & Partner“) noch einmal an die Email-Adresse des Vic verschickt – mit denselben Zugangsdaten (Klartext-Passwort aus `profiles.temp_password`).

## UI

- Neuer Button „Ihr Fall Email neu senden“ in der Profil-Card neben „Bearbeiten“ (nur für Admin sichtbar, mit Mail-Icon).
- Klick öffnet einen Bestätigungsdialog mit Empfänger-Email.
- Nach Bestätigen: Button zeigt Spinner, danach Toast „Email versendet“ oder Fehlermeldung.
- Button deaktiviert, wenn keine Email oder kein `temp_password` gesetzt ist (Tooltip erklärt warum).

## Backend

Neue Edge Function `resend-account-email`:
- Admin-Auth (JWT + `has_role admin`) wie `create-user`.
- Input: `{ user_id }`.
- Lädt `profiles` (email, first_name, last_name, temp_password) und `app_settings`.
- Rendert dieselbe Vorlage über `renderCredentialsEmail` und sendet via Resend mit demselben Betreff `Ihr Fall bei ${company_name}`.
- Kein SMS-Versand, keine Telegram-Notification, keine Kontoerstellung.
- Fehlerfälle: 400 wenn Email/`temp_password` fehlen; 500 mit Resend-Fehlertext bei Versandfehler.

## Technische Details

- Datei `supabase/functions/resend-account-email/index.ts` (auto-deployed).
- Nutzt bestehende `_shared/emailTemplate.ts`-Helper und `app_settings.resend_*`.
- Frontend ruft `supabase.functions.invoke("resend-account-email", { body: { user_id } })` in `AdminVicDetail.tsx`.
- Keine DB-Schema-Änderungen.
