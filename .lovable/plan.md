# E-Mail-Vorschau: Betreff anzeigen

Auf `/admin/emails` fehlt bei der Vorschau der Betreff, der beim tatsächlichen Versand verwendet wird. Aktuell steht der Betreff nur hartkodiert in der Edge Function `create-user`.

## Änderungen

1. **`src/lib/emailTemplates.ts`** – neuen Helper exportieren:
   ```ts
   export function buildCredentialsSubject(settings: AppSettings): string {
     return `Ihre Zugangsdaten – ${settings.company_name || "Mandantenportal"}`;
   }
   ```
   Damit ist der Betreff eine einzige Source of Truth.

2. **`src/components/AdminEmailTemplates.tsx`** – Betreff berechnen und in der Vorschau-Card oberhalb des iframes anzeigen (Label „Betreff“, monospace/kräftig, mit Absender-Zeile falls sinnvoll: „Von: {from_name} <{from_email}>“ aus `settings`).

3. **`supabase/functions/create-user/index.ts`** – `buildCredentialsSubject(s)` statt des Inline-Strings verwenden, damit Vorschau und Versand identisch bleiben. (Import aus `_shared` oder Duplikat im Function-Ordner, je nach vorhandenem Setup.)

## Nicht enthalten
- Kein Versand, keine neuen Templates.
- Keine Änderung am HTML-Body oder an SMS.
