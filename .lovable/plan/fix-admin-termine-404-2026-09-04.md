# Fix: /admin/termine 404

Die Route ist in `src/App.tsx` nie registriert worden, deshalb landet der Aufruf im Catch-all-404.

## Änderung
- `src/App.tsx`: neue Route `/admin/termine` analog zu den anderen Admin-Routen ergänzen (Zugriff für Admin und Caller), sodass `AdminPanel` sie rendert und den bereits vorhandenen `AdminAppointments`-Reiter anzeigt.

Keine weiteren Dateien betroffen; `AdminPanel` und `AdminAppointments` existieren bereits.
