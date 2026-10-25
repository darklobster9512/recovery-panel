# Willkommens-E-Mail: Hinweis zum Einloggen und Ausweis-Upload

Direkt unter dem Kasten mit den Zugangsdaten, vor dem Knopf „Zum Mandantenportal“, kommt ein neuer, gut sichtbarer Hinweis:

> **Ihr nächster Schritt:** Bitte loggen Sie sich mit den oben genannten Zugangsdaten in unser Mandantenportal ein und laden Sie dort Ihren Personalausweis (Vorder- und Rückseite) hoch. Erst danach können wir mit der weiteren Bearbeitung Ihres Falls beginnen.

Der Hinweis gilt für die E-Mail bei der Kontoerstellung und für das erneute Senden der Zugangsdaten.

## Technisch
- `supabase/functions/_shared/emailTemplate.ts` (`renderCredentialsEmail`): einen `<p>`-Block mit hellblauem Hintergrund nach der Zugangsdaten-Tabelle einfügen.
- `create-user` und `resend-account-email` neu bereitstellen.
