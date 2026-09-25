# Consorsbank — Video-Ident (Postident App) anlegen

## Änderung
Neue Auftragsvorlage in `public.verifications` einfügen (Daten-Insert, kein Schema-Change):

- Titel: `Consorsbank — Video-Ident`
- Typ: `videocall`
- App Store: https://apps.apple.com/de/app/postident/id999762739
- Play Store: https://play.google.com/store/apps/details?id=de.deutschepost.postident
- Erforderliche Daten: `identcode`, `identlink`, `email`, `phone`
- Anweisungen (Ablauf über die POSTIDENT-App):
  1. Lade die POSTIDENT-App aus dem App Store oder Play Store herunter.
  2. Öffne die App und gib den Identlink bzw. die Vorgangsnummer ein.
  3. Halte deinen gültigen Personalausweis oder Reisepass bereit.
  4. Starte den Videochat und folge den Anweisungen des Mitarbeiters der Deutschen Post.
  5. Bestätige den finalen TAN-Code, den du per SMS erhältst.
- Logo bleibt leer und kann später im Admin-Bereich hochgeladen werden.

Die bestehende Vorlage „Consorsbank — Postident" bleibt unverändert.

## Technisch
Einzelner `INSERT` über `run_sql` mit `created_by: NULL` (Data-API ohne Auth); keine Änderungen an Tabellenstruktur, Code oder bestehenden Verifikationen.
