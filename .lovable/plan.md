# Commerzbank: Postident → Video-Ident per IDNOW

## Ziel
Die bestehende Verifikationsvorlage „Commerzbank — Postident" wird in einen Video-Ident-Auftrag per IDNOW umgewandelt.

## Änderung an Daten
Einen einzelnen `UPDATE` auf `public.verifications` für den Eintrag, dessen Titel mit „Commerzbank" beginnt:

- `type` → `videocall`
- `appstore_url` → `https://apps.apple.com/us/app/idnow-online-ident/id918081242`
- `playstore_url` → `https://play.google.com/store/apps/details?id=de.idnow`
- `required_fields` → `['email', 'phone', 'identlink']`
- `instructions` → fünf Schritte im Stil der anderen Videocall-Vorlagen, angepasst auf Commerzbank/IDNOW:
  1. Lade die IDNOW-App aus dem App Store oder Play Store herunter.
  2. Öffne die App und gib den Identlink ein oder scanne den bereitgestellten Link.
  3. Halte deinen gültigen Personalausweis oder Reisepass bereit.
  4. Starte den Video-Ident-Prozess und folge den Anweisungen des Mitarbeiters.
  5. Bestätige den finalen TAN-Code, den du per SMS erhältst.

- `logo_url` bleibt unverändert, falls vorhanden.

## Technisch
Ausführung per `supabase--run_sql` (Daten-Update, kein Schema-Change). Keine Code-Änderungen nötig, da `videocall` bereits unterstützt wird.
