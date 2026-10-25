# Personalausweis nach Löschen wieder hochladbar

## Ursache
Beim Löschen wird die Upload-Sperre des Vics bereits zurückgesetzt. Der Bereich „Personalausweis hochladen“ erscheint beim Vic aber nur, wenn er **gar keinen Auftrag** hat. Sobald ein Auftrag (z.B. Consorsbank) zugewiesen ist, kann er den Ausweis also nie wieder hochladen.

## Änderung
- **Vic-Seite „Dokumente hochladen“:** Der Bereich „Personalausweis hochladen“ (Vorder- und Rückseite) wird immer angezeigt, wenn noch kein Ausweis vorliegt, auch wenn der Vic Aufträge hat. Er steht dann oberhalb der Auftragsauswahl. Der Hinweis „Aktuell ist kein Auftrag verfügbar“ erscheint nur, wenn wirklich kein Auftrag da ist.
- Nach erfolgreichem Upload verschwindet der Bereich wieder (wie bisher, nur einmal möglich).
- **Löschen durch Admin und Caller** (/admin/dokumente): Beide setzen die Sperre zurück. Wenn das Zurücksetzen fehlschlägt, kommt eine Fehlermeldung, statt dass es still scheitert.

## Technische Details
- `src/components/DocumentUpload.tsx`: `showIdSection = !initialLoading && !idSubmittedAt`; `showAssignmentSelect = assignments.length > 0`; Hinweistext abhängig von `assignments.length`.
- `src/components/AdminDocuments.tsx` `removeDocuments`: Fehler beim `profiles`-Update prüfen und werfen. Callers haben bereits UPDATE-Rechte auf Profile ihrer zugewiesenen Vics sowie DELETE auf deren Dokumente, keine Datenbankänderung nötig.
