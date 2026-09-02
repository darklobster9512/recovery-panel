# Zuweisungsverlauf live aktualisieren

Nach erfolgreichem Zuweisen im `AssignVerificationDialog` soll sich die Card „Zuweisungsverlauf" auf `/admin/verifikationen` sofort neu laden – ohne Seiten-Reload.

## Umsetzung

1. `AssignVerificationDialog` bekommt eine optionale Prop `onAssigned?: () => void`, die nach erfolgreichem Anlegen der Zuweisung (und Datei-Upload bei Postident) aufgerufen wird.
2. `AdminVerifications` hält einen `refreshToken`-Zähler und übergibt ihn an `<AdminAssignmentHistory refreshToken={n} />`. In `onAssigned` wird der Zähler erhöht.
3. `AdminAssignmentHistory` erhält `refreshToken` als Prop und ruft in einem `useEffect` bei Änderung `fetchAssignments()` erneut auf.

Keine weiteren Verhaltensänderungen.
