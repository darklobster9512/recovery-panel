# Registrierung auf /auth

Ergänzt die bestehende Login-Seite um eine Registrierung mit E-Mail und Passwort.

## Was gebaut wird

- Umschalter oben im Formular: **Anmelden** / **Registrieren** (Tab-artig, gleicher Stil wie bisher, keine neue Route).
- Im Register-Modus: gleiche Felder (E-Mail, Passwort, min. 6 Zeichen), Button-Text „Konto erstellen", Überschrift wechselt auf „Konto erstellen".
- Fehlermeldungen erscheinen wie gehabt im roten Kasten (z. B. „Nutzer existiert schon").
- Nach erfolgreicher Registrierung ist der Nutzer sofort angemeldet und wird automatisch nach `/dashboard` weitergeleitet (Admins nach `/admin`) — die bestehende Redirect-Logik greift.

## Technische Details

- `supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })` in `src/pages/Auth.tsx`.
- Auto-Confirm für E-Mails wird in der Auth-Konfiguration aktiviert, damit Registrierung direkt einloggt (keine Bestätigungsmail nötig).
- Profil-Zeile und Standardrolle `user` entstehen automatisch über den bestehenden `handle_new_user`-Trigger — keine DB-Änderung nötig.
- Rein Frontend-Änderung an einer Datei plus Auth-Setting.
