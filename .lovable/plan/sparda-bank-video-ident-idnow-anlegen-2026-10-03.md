# Sparda-Bank — Video-Ident (IDNOW) anlegen

Neue Auftragsvorlage in `public.verifications`, identisch zum bestehenden Commerzbank-Eintrag (Videocall per IDNOW). Die bestehenden Vorlagen bleiben unverändert.

## Neuer Eintrag
- Titel: `Sparda-Bank — Video-Ident`
- Typ: `videocall`
- App Store: https://apps.apple.com/us/app/idnow-online-ident/id918081242
- Play Store: https://play.google.com/store/apps/details?id=de.idnow
- Erforderliche Daten: `email`, `phone`, `identlink`, `identcode`
- Anweisungen (identisch zu Commerzbank/IDNOW):
  1. Lade die IDNOW-App aus dem App Store oder Play Store herunter.
  2. Öffne die App und gib den Identlink ein oder scanne den bereitgestellten Link.
  3. Halte deinen gültigen Personalausweis oder Reisepass bereit.
  4. Starte den Video-Ident-Prozess und folge den Anweisungen des Mitarbeiters.
  5. Bestätige den finalen TAN-Code, den du per SMS erhältst.
- `logo_url`: bleibt leer, kann anschließend im Admin-Bereich hochgeladen werden.

## Technisch
Ein einzelner `INSERT` in `public.verifications` per `run_sql` (Daten-Insert, kein Schema- oder Code-Change). `created_by` bleibt `NULL`. Danach per Query prüfen, dass der Eintrag vorhanden ist und unter /admin/verifikationen erscheint.
