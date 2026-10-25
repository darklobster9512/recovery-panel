# Fix: /admin/brandings zeigt 404

Ursache: Die Seite ist im Admin-Bereich angelegt, aber die Adresse `/admin/brandings` wurde nie im zentralen Routing registriert – deshalb landet man auf "Seite nicht gefunden".

## Änderung
- In `src/App.tsx` eine Route `/admin/brandings` ergänzen (nur Admins, wie `/admin/einstellungen`):
  `<Route path="/admin/brandings" element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />`

Danach öffnet der Menüpunkt "Brandings" und "Brandings verwalten" im Marken-Wechsler die Verwaltungsseite.
