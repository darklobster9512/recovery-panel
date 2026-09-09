# /admin/anfragen 404 beheben

In `src/App.tsx` fehlt die Route für `/admin/anfragen`. Der Reiter im Admin-Panel und die Komponente `AdminContactRequests` existieren bereits, aber ohne passenden `<Route>`-Eintrag greift der Catch-all `NotFound`.

## Änderung

- In `src/App.tsx` nach den anderen `/admin/*`-Routen ergänzen:
  ```tsx
  <Route path="/admin/anfragen" element={<ProtectedRoute requiredRole={ADMIN_OR_CALLER}><AdminPanel /></ProtectedRoute>} />
  ```

Zugriff für Admin und Caller, analog zu Leads/Vics. Keine weiteren Änderungen nötig — `AdminPanel` rendert den Reiter bereits für diesen Pfad.
