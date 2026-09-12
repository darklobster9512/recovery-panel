# Plan: Identcode-Feld für Commerzbank/IDNOW

## Ziel
Bei der Commerzbank-Verifikation (Video-Ident per IDNOW) soll im Zuweisen-Dialog ein zusätzliches Feld „Identcode" verfügbar sein. Der Code hat das IDNOW-Format `JAR-FJCST` (Buchstaben und Bindestrich), nicht das numerische 9-stellige WebID-Format.

## Bestätigter Ist-Zustand
- `public.verifications`: Commerzbank-Eintrag existiert mit `type = 'videocall'`, `title = 'Commerzbank — Postident'`, `required_fields = ['email','phone','identlink']`.
- `AssignVerificationDialog.tsx` zeigt `required_fields` dynamisch an, ordnet `identlink` vor `identcode` ein und extrahiert aus `identlink` automatisch die letzten 9 Ziffern.
- Das Identcode-Eingabefeld ist aktuell `readOnly`, sobald ein `identlink` vorhanden ist.
- `Dashboard.tsx` zeigt vorhandene `field_values` in der Sektion „Zugangsdaten" bereits an, inklusive `identcode`.

## Schritte

### 1. Datenbank: Commerzbank-Vorlage erweitern
- `supabase--run_sql` verwenden.
- `required_fields` des Commerzbank-Eintrags auf `['email','phone','identlink','identcode']` ändern.

### 2. Zuweisen-Dialog anpassen (`src/components/AssignVerificationDialog.tsx`)
- `identcode`-Eingabefeld nicht mehr `readOnly` machen, damit IDNOW-Codes wie `JAR-FJCST` manuell eingegeben werden können.
- Platzhaltertext auf Format-Hinweis setzen, z.B. `z.B. JAR-FJCST`.
- Auto-Extraktion aus `identlink` anpassen: Nur überschreiben, wenn ein 9-stelliger numerischer Code gefunden wird **und** das Feld leer oder selbst rein numerisch ist. Bereits eingetippte IDNOW-Codes dürfen nicht durch das Einfügen eines Links gelöscht werden.

### 3. Dashboard-Prüfung (`src/pages/Dashboard.tsx`)
- Keine Code-Änderung nötig. `FIELD_ORDER` enthält `identcode` bereits; der eingegebene Code erscheint automatisch in den Zugangsdaten mit Kopieren-Button.
- Visuell kurz validieren, dass der Code dort korrekt angezeigt wird.

### 4. Validierung
- In `/admin/verifikationen` Commerzbank öffnen und auf „Zuweisen" klicken.
- Vic auswählen, Identlink eintragen und im Identcode-Feld `JAR-FJCST` eingeben.
- Speichern und im Dashboard prüfen, dass der Code unter „Zugangsdaten" erscheint.
