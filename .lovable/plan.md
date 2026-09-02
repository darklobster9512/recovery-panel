# /admin/telegram 404 beheben

In `src/App.tsx` fehlt die Route für `/admin/telegram`. Der Sidebar-Link zeigt darauf, aber es gibt keinen passenden `<Route>`-Eintrag, deshalb greift `NotFound`.

## Änderung

- In `src/App.tsx` nach den anderen `/admin/*`-Routen eine neue Route ergänzen:
  ```tsx
  <Route path="/admin/telegram" element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />
  ```

Keine weiteren Änderungen. `AdminPanel` rendert `AdminTelegram` bereits für diesen Pfad.
