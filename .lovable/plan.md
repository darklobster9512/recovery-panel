# Löschen-Button für Dokumente in /admin/dokumente

## Ziel
In der Dokumenten-Übersicht soll bei jeder Zeile (insbesondere „Personalausweis") ein Löschen-Button stehen. Damit lassen sich alle Dokumente dieser Gruppe direkt im Adminbereich entfernen — ohne manuelle Nachfrage im Chat.

## Verhalten
- Neue Spalte „Aktion" mit Papierkorb-Symbol pro Zeile (Klick löst nicht die Detailansicht aus).
- Vorher Sicherheitsabfrage: „Alle X Dokumente von <Name> für <Auftrag> endgültig löschen?"
- Beim Löschen passiert:
  1. Alle Dateien der Gruppe werden aus dem Speicher entfernt.
  2. Alle zugehörigen Dokument-Einträge werden gelöscht.
  3. Bei der Gruppe „Personalausweis" (ohne Auftrag) wird zusätzlich der Marker „Ausweis bereits eingereicht" zurückgesetzt, damit der Nutzer sofort wieder hochladen kann.
- Danach Erfolgsmeldung und Liste aktualisiert sich; die Zeile verschwindet.
- Auch in der Detailansicht bekommt jede einzelne Datei einen Löschen-Button (gleiche Logik, nur eine Datei).

## Aktueller Stand (geprüft)
- Es gibt keine Löschregel für Dokumente in der Datenbank — Admins können derzeit keine Dokument-Einträge löschen. Das muss ergänzt werden.
- Admins dürfen Profile bereits ändern, das Zurücksetzen des Ausweis-Markers funktioniert also ohne weitere Änderung.
- Für das Entfernen der Dateien existiert bereits die Hilfsfunktion `admin-cleanup-files`; sie prüft aktuell keine Berechtigung und wird dabei abgesichert.

## Technische Details
1. Migration:
   - `GRANT DELETE ON public.user_documents TO authenticated;`
   - Policy `Admins delete documents` — `FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'))`.
2. `supabase/functions/admin-cleanup-files/index.ts`: Authorization-Header auslesen, Nutzer über Anon-Client auflösen, `has_role(uid,'admin')` prüfen, sonst 403; CORS-Header (inkl. OPTIONS) ergänzen, damit der Aufruf aus dem Browser funktioniert.
3. `src/components/AdminDocuments.tsx`:
   - `deleteGroup(group)` und `deleteDoc(doc)`: Pfade sammeln → `supabase.functions.invoke("admin-cleanup-files", { body: { paths } })` → `delete().in("id", ids)` auf `user_documents` → bei `assignment_id === null` zusätzlich `profiles.id_document_submitted_at = null` → `loadGroups()` bzw. lokalen State aktualisieren.
   - Buttons mit `Trash2`, `e.stopPropagation()`, Bestätigung über AlertDialog, Ladezustand am Button.
