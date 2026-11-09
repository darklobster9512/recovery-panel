# Fix: Anweisung-Seite zeigt "404"

## Ursache
Die neue Seite "Anweisung" wurde im Menü eingetragen, aber nicht in der Liste der erlaubten Seitenadressen der App. Deshalb landet man auf "Seite nicht gefunden".

## Lösung
- Adresse `/admin/anweisung` hinzufügen, freigegeben für Admins, Manager und Caller.
- Danach Seite öffnen und prüfen, dass Editor bzw. Text erscheint.

## Technische Details
- `src/App.tsx`: `<Route path="/admin/anweisung" element={<ProtectedRoute requiredRole={ADMIN_OR_CALLER}><AdminPanel /></ProtectedRoute>} />`
