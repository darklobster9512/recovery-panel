# Verknüpfen in das Bearbeiten-Fenster verschieben

- **Tabelle /admin/caller:** Der Button „Verknüpfen“ entfällt. Die Spalte „Verknüpft“ zeigt die verbundenen Konten weiter als reine Anzeige, ohne ✕ zum Lösen.
- **Bearbeiten-Fenster:** Unter „Branding“ kommt ein neuer Abschnitt „Verknüpfte Konten“. Dort stehen Caller aus anderen Brandings als Auswahlliste mit Häkchen, je mit Name, Branding und E-Mail. Pro Branding lässt sich höchstens ein Konto wählen.
- **Speichern:** Die Häkchen werden zusammen mit Name, Telefon, Bild und Branding über den bestehenden Speichern-Button übernommen. Häkchen entfernen löst die Verknüpfung.

## Technische Details
- `CallerLinks.tsx`: Die Auswahlliste wird als eigene Komponente `CallerLinkPicker` (kontrolliert über `selected`/`onChange`) herausgelöst, dazu eine Funktion `saveCallerLinks(callerId, selectedIds, ctx)` mit der bisherigen Gruppenlogik. Der separate Dialog und der Lösen-Button in den Badges entfallen.
- `AdminCallers.tsx`: In `openEdit` wird die Auswahl aus `linkCtx.linkedOf` vorbelegt. `handleSaveEdit` ruft nach dem Profil-Update `saveCallerLinks` auf und danach `linkCtx.reload()`.
