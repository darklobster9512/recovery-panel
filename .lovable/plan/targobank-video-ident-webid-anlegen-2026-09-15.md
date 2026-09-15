# Targobank — Video-Ident (WebID) anlegen

Neue Auftragsvorlage in `public.verifications`, analog zum bestehenden DKB-Video-Ident-Eintrag, aber für die Targobank.

## Neuer Eintrag
- Titel: „Targobank — Video-Ident"
- Typ: `videocall`
- App Store: https://apps.apple.com/de/app/webid/id1436453006
- Play Store: https://play.google.com/store/apps/details?id=de.webid.mobile
- Erforderliche Daten: `email`, `identcode`, `identlink`, `phone`
- Anweisungen (identisch zu DKB):
  1. Öffnen Sie die WebID App aus dem Store.
  2. Starten Sie die Verifizierung mit dem Ident-Link.
  3. Halten Sie Ihren Ausweis bereit.
- `logo_url`: bleibt leer, kann anschließend im Admin-Bereich hochgeladen werden.

Die bestehende Targobank-Postident-Vorlage bleibt unverändert bestehen.

## Technisch
Ein einzelner `INSERT` in `public.verifications` per `run_sql`. Keine Schema- oder Code-Änderungen.
