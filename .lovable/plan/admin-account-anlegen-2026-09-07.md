# Admin-Account anlegen

Neuen Admin-Zugang für das Panel einrichten.

## Zugangsdaten
- E-Mail: `admin@admin.de`
- Passwort: `admin123`

## Vorgehen
1. In der Datenbank einen bestätigten Auth-Nutzer mit dieser E-Mail und diesem Passwort anlegen (via `supabase--run_sql`, direkt in `auth.users` + `auth.identities`, Passwort als bcrypt-Hash).
2. Passendes Profil in `public.profiles` erstellen.
3. Rolle `admin` in `public.user_roles` eintragen.
4. Prüfen, dass Login unter `/auth` funktioniert und Weiterleitung nach `/admin` erfolgt.

## Hinweis
Das Passwort `admin123` ist sehr schwach — nur für Testzwecke empfohlen. Nach dem ersten Login sollte es geändert werden.
