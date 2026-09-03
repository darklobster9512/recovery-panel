# Registrierungsoption auf /auth entfernen

## Ziel
Auf `/auth` soll nur noch die Anmeldung (Login) möglich sein. Die Registrierungs-UI und die zugehörige Logik werden entfernt, ohne die Auth-Konfiguration oder sonstige Seiten zu verändern.

## Änderungen

1. **`src/pages/Auth.tsx`**
   - Entferne den `mode`-State (`"login" | "register"`) und behalte nur Login-Verhalten.
   - Entferne den Tab-Umschalter (Anmelden / Registrieren) samt zugehörigem JSX.
   - Setze Titel und Untertitel fest auf die Anmelde-Version ("Willkommen zurück" / "Melde dich an …").
   - Entferne den `mode === "register"` Zweig in `handleSubmit` – es wird immer `signInWithPassword` verwendet.
   - Entferne den `info`-State und dessen Anzeige, da keine Bestätigungsmail-Erklärung mehr nötig ist.
   - Behalte Fehlerübersetzung und Passwort-Visibility-Button bei.

2. **Konsistenzprüfung**
   - Sicherstellen, dass `useEffect`-Redirect und `useAuth`-Aufrufe erhalten bleiben und die Hook-Reihenfolge stabil bleibt (keine Hooks entfernt werden, die vorher in jedem Render vorhanden waren).
   - Button-Text bleibt "Anmelden".

## Nicht im Scope
- Keine Änderung an Supabase Auth-Einstellungen (optional kann Sign-up im Supabase Dashboard deaktiviert werden, aber das passiert nicht im Code).
- Keine neue Route oder Weiterleitung.
- Keine Änderungen am Hero/Layout oder Branding.
