# Personalausweis-Upload bei fehlendem Auftrag

Wenn ein Nutzer im Dashboard „Dokumente hochladen" öffnet und **noch kein Auftrag** zugewiesen ist, soll er stattdessen einmalig **Personalausweis (Vorder- und Rückseite)** hochladen können. Nach dem ersten erfolgreichen Upload verschwindet diese Option dauerhaft — es erscheint dann wieder das gewohnte Auftrags-Dropdown, das bei leerer Liste einen Platzhaltertext zeigt.

## Verhalten

1. **Zustand A — keine Aufträge & Personalausweis noch nicht eingereicht:**
   - Kein Auftrags-Dropdown.
   - Zwei separate Upload-Slots: „Personalausweis Vorderseite" und „Personalausweis Rückseite" (PNG/JPG/PDF, max. 20 MB).
   - Button „Personalausweis absenden" ist aktiv, sobald beide Seiten ausgewählt sind.
   - Nach Absenden: Toast, State wechselt zu Zustand B/C.

2. **Zustand B — keine Aufträge, Personalausweis bereits eingereicht:**
   - Auftrags-Dropdown sichtbar, disabled/offen zeigt Platzhalter: „Aktuell steht kein Auftrag zur Verfügung."
   - Kein Personalausweis-Bereich mehr.

3. **Zustand C — Aufträge vorhanden:** unverändert (aktuelles Verhalten).

## Datenmodell

- Neue Spalte `profiles.id_document_submitted_at timestamptz` (nullable). Wird beim ersten erfolgreichen Personalausweis-Upload gesetzt. Dient als „einmalig"-Marker.
- Dateien werden im bestehenden `user-documents` Bucket unter `<user_id>/personalausweis/front_*` und `back_*` abgelegt.
- Damit die Dateien auch im Admin unter `/admin/dokumente` erscheinen, wird `user_documents.assignment_id` **nullable** gemacht und eine neue Spalte `kind text default 'assignment'` ergänzt (Werte: `assignment`, `personalausweis`). Personalausweis-Uploads bekommen `assignment_id = NULL`, `kind = 'personalausweis'`.

## UI-Änderungen (`src/components/DocumentUpload.tsx`)

- Beim Laden zusätzlich `profiles.id_document_submitted_at` für den eingeloggten Nutzer abfragen.
- Rendering-Logik nach den drei Zuständen oben.
- Neuer Bereich mit zwei File-Inputs für Vorder-/Rückseite; Upload-Handler lädt beide Dateien hoch, schreibt zwei Zeilen in `user_documents` (`kind='personalausweis'`, `assignment_id=null`) und setzt `profiles.id_document_submitted_at = now()`.
- Auftrags-`<Select>` bekommt bei leerer Liste einen deaktivierten `SelectItem`-Platzhalter mit dem Text „Aktuell steht kein Auftrag zur Verfügung.".

## Admin-Ansicht

- `/admin/dokumente` (`AdminDocuments.tsx`) gruppiert bisher nach `user_id + assignment_id`. Für Zeilen mit `assignment_id = null` wird als Auftragstitel „Personalausweis" angezeigt; Detailansicht funktioniert weiterhin.

## Technische Details

- Migration:
  - `ALTER TABLE profiles ADD COLUMN id_document_submitted_at timestamptz;`
  - `ALTER TABLE user_documents ALTER COLUMN assignment_id DROP NOT NULL;`
  - `ALTER TABLE user_documents ADD COLUMN kind text NOT NULL DEFAULT 'assignment';`
  - RLS bleibt unverändert (bestehende Policies decken beide Fälle über `user_id = auth.uid()` ab).
- Kein E-Mail-/SMS-Versand, kein neuer Reiter.
