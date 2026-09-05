# Caller-Sichtbarkeit: Termine & Leads-Reiter

## Termine
Bereits eingerichtet — keine Änderung nötig.
- RLS-Policy `Callers select assigned appointments` erlaubt Callern, alle Termine ihrer zugewiesenen Vics zu sehen (egal ob vom Vic selbst gebucht oder vom Caller erstellt).
- `AdminAppointments` lädt Termine ohne extra Filter; RLS filtert automatisch auf die erlaubten Zeilen.

## Leads-Reiter für Caller ausblenden
In `src/pages/AdminPanel.tsx`:
- `Leads`-Nav-Eintrag auf `adminOnly: true` setzen, damit er im Caller-Konto nicht erscheint.
- Route-Guard: In `renderRoute` bei `/admin/leads` und `/admin/leads/:id` für Nicht-Admins auf `/admin/vics` umleiten, falls der Caller die URL direkt aufruft.
