# WebID-Redirect Toggle im Zuweisungs-Popup

## Ziel
Im Zuweisen-Popup (Schritt „Ident-Daten") einen Toggle „WebID Redirect aktivieren" ergänzen. Wenn aktiv, sieht der Vic im Dashboard **keine App-Download-Buttons** mehr und die Anleitung wird so umformuliert, dass er statt der WebID-App den Identlink verwenden soll.

## Umfang
- Nur relevant für Videocall-Aufträge, die `identlink` als Pflichtfeld haben (DKB, Deutsche Bank).
- Wird pro Zuweisung gespeichert, nicht pro Verifikations-Template.

## Änderungen

### 1. Datenbank
Neue Spalte `webid_redirect boolean not null default false` auf `verification_assignments`.

### 2. `AssignVerificationDialog.tsx`
- Neuer State `webidRedirect`.
- Toggle (gleicher Style wie „TAN weiterleiten") direkt unterhalb des Ident-Daten-Blocks, angezeigt wenn `!isPostident && required_fields.includes("identlink")`.
- Beim Insert in `verification_assignments` mitschreiben.

### 3. `Dashboard.tsx` (Vic-Ansicht)
- `webid_redirect` beim Assignment-Load mitladen.
- Wenn `true`:
  - App-Store/Play-Store-Badges nicht rendern.
  - Instructions durch einen festen Redirect-Text ersetzen:
    1. Öffne den unten hinterlegten Identlink in deinem Browser.
    2. Folge den Anweisungen auf der Webseite und halte deinen gültigen Personalausweis oder Reisepass bereit.
    3. Starte den Videocall und folge den Anweisungen des WebID-Mitarbeiters.
    4. Bestätige den finalen TAN-Code, den du per SMS erhältst.

Kein weiterer Ort ist betroffen (Admin-Ansichten zeigen keine App-Links / Instructions gegenüber dem Vic).
