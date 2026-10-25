# Caller löschen im Bearbeiten-Popup

## Was neu ist
- Im Bearbeiten-Fenster auf /admin/caller unten links ein roter Button "Caller löschen".
- Klick öffnet eine Sicherheitsabfrage: "Caller {Name} wirklich löschen? Das Konto wird dauerhaft entfernt und kann sich nicht mehr einloggen."
- Nach Bestätigung wird das Konto gelöscht, das Popup schließt sich, die Liste aktualisiert sich, kurze Erfolgsmeldung.
- Vics, Leads, Termine und Aufgaben, die diesem Caller zugewiesen waren, bleiben erhalten und sind danach "ohne Caller" (können neu zugewiesen werden).
- Verknüpfungen zu anderen Caller-Konten werden mit entfernt.
- Nur Admins können löschen.

## Technische Umsetzung
- Neue Edge Function `delete-caller`: prüft serverseitig, dass der Aufrufer Admin ist und das Ziel die Rolle `caller` hat (kein Löschen von Admins/Vics, nicht sich selbst). Dann: `caller_account_links` des Callers löschen, Zuweisungen (`profiles.assigned_caller_id`, `leads.assigned_caller_id`, `todos.assigned_caller_id`, `appointments.caller_id`) auf `null` setzen, Avatar aus `caller-avatars` entfernen, anschließend `auth.admin.deleteUser`.
- `AdminCallers.tsx`: Button im `DialogFooterBar` links, `AlertDialog` zur Bestätigung, Aufruf der Function, danach `invalidateBrandingProfileIds()`, `linkCtx.reload()`, `load()`.
