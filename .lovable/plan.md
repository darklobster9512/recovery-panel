

# Fix: Häufiges Ausloggen verhindern

## Problem
Jede Komponente, die `useAuth()` aufruft (ProtectedRoute, Auth, Dashboard, AdminPanel), erstellt einen **eigenen** Auth-Listener und eigenen State. Beim Navigieren zwischen Seiten wird der State jedes Mal neu initialisiert (`loading: true, user: null`), was kurzzeitig als "nicht eingeloggt" interpretiert wird und zu Redirects auf `/auth` führt.

Zusätzlich wird innerhalb von `onAuthStateChange` ein asynchroner Datenbank-Call (`fetchRole`) gemacht, was gegen Supabase Best Practices verstößt und Race Conditions verursachen kann.

## Lösung: Shared AuthContext Provider

### 1. `src/contexts/AuthContext.tsx` (neu)
- Einen React Context + Provider erstellen, der **einmalig** den Auth-State hält
- `onAuthStateChange` wird nur einmal registriert (im Provider)
- `fetchRole` wird mit `setTimeout(0)` entkoppelt vom Auth-Callback (Supabase empfiehlt keine async Arbeit im Listener)
- Der Provider wird in `App.tsx` um alles gewrappt

### 2. `src/hooks/useAuth.ts` (anpassen)
- Wird zu einem einfachen `useContext(AuthContext)` Wrapper
- Kein eigener State, kein eigener Listener mehr

### 3. `src/App.tsx`
- `<AuthProvider>` um `<BrowserRouter>` wrappen

### Ergebnis
- Auth-State wird **einmal** geladen und global geteilt
- Kein Re-Init beim Seitenwechsel
- Session bleibt stabil erhalten über `localStorage` + `autoRefreshToken`

