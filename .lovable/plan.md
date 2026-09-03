# Auth-Fehlermeldungen auf Deutsch

Auf `/auth` werden Fehler von Supabase (z. B. „Invalid login credentials“) aktuell im englischen Originaltext angezeigt, weil `err.message` direkt gesetzt wird.

## Umsetzung

In `src/pages/Auth.tsx` eine kleine Mapping-Funktion `translateAuthError(err)` einfügen, die typische Supabase-Auth-Fehler auf deutsche Texte übersetzt und im `catch` statt `err.message` verwendet wird.

## Übersetzungen

- `Invalid login credentials` → „E-Mail oder Passwort ist falsch.“
- `Email not confirmed` → „Bitte bestätige zuerst deine E-Mail-Adresse.“
- `User already registered` → „Für diese E-Mail-Adresse existiert bereits ein Konto.“
- `Password should be at least 6 characters` → „Das Passwort muss mindestens 6 Zeichen lang sein.“
- `Unable to validate email address: invalid format` → „Ungültige E-Mail-Adresse.“
- `Email rate limit exceeded` → „Zu viele Anfragen. Bitte versuche es später erneut.“
- `signup is disabled` → „Registrierung ist derzeit deaktiviert.“
- Fallback für Unbekanntes → „Es ist ein Fehler aufgetreten. Bitte versuche es erneut.“

Keine weiteren Änderungen (Layout, Logik, andere Seiten unverändert).
