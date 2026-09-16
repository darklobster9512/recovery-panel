# Löschen in /admin/dokumente nur für „Personalausweis"

## Ziel
Der Löschen-Button (Mülleimer) soll nur bei Dokumenten-Gruppen ohne Auftrag – also der Kategorie „Personalausweis" – angezeigt werden. Auftrags-Dokumente (z. B. Consorsbank) können nicht mehr gelöscht werden, weder von Admin noch von Caller.

## Änderungen (nur `src/components/AdminDocuments.tsx`)

1. **Listen-Ansicht (Zeilen)**
   - Den Löschen-Button (~Zeile 488) nur rendern, wenn `g.assignment_id === null` (Personalausweis).
   - Bei Auftrags-Gruppen erscheint nur der Ansehen-Button.

2. **Detail-Ansicht (einzelne Dateien)**
   - Den Löschen-Button pro Datei (~Zeile 383) nur rendern, wenn `detail.assignmentId === null`.

3. **Sicherheitsnetz**
   - In `handleDeleteGroup` / `handleDeleteDoc` eine Prüfung ergänzen: bei vorhandener `assignment_id` sofort abbrechen (Toast: „Nur Personalausweis-Dokumente können gelöscht werden"), damit die Aktion auch nicht versehentlich über andere Wege ausgelöst werden kann.

## Keine Änderungen an
- Datenbank, RLS-Policies oder Edge Functions (bleiben wie sie sind).
- Upload-Logik im Vic-Dashboard.

## Verifikation
- `bunx tsc --noEmit`
- Kurzer Sicht-Check im Code, dass beide Button-Stellen die Bedingung nutzen.
