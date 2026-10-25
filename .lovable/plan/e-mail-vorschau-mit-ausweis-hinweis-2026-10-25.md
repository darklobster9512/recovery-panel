# E-Mail-Vorschau mit Ausweis-Hinweis

Die Vorschau auf /admin/emails nutzt eine eigene Kopie der E-Mail-Vorlage, darum fehlt dort der neue Hinweis. Der hellblaue Kasten „Ihr nächster Schritt: … einloggen … Personalausweis hochladen …“ kommt nun auch in diese Vorschau, gleich formatiert und an derselben Stelle wie in der verschickten E-Mail.

## Technisch
- In `src/lib/emailTemplates.ts` denselben Tabellenblock wie in `supabase/functions/_shared/emailTemplate.ts` direkt nach der Zugangsdaten-Tabelle einfügen.
