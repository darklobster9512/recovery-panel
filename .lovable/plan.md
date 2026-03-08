

# Fix: Tab-Wechsel Loading Spinner

## Problem

Zwei Ursachen bewirken den Reload beim Tab-Wechsel:

1. **AuthContext**: `onAuthStateChange` filtert nur `TOKEN_REFRESHED`, aber Supabase feuert beim Tab-Wechsel auch andere Events (z.B. `INITIAL_SESSION`). Diese setzen `setUser()` mit einem neuen Objekt-Reference, was Downstream-Effects auslöst.

2. **Dashboard**: `useEffect([user])` reagiert auf jede Referenz-Änderung des `user`-Objekts und ruft `loadAssignments()` auf, das `setLoading(true)` setzt → Loading Spinner erscheint.

## Lösung

### 1. AuthContext (`src/contexts/AuthContext.tsx`)
- `onAuthStateChange` soll **nur** bei `SIGNED_IN` und `SIGNED_OUT` den vollen State-Update machen
- Alle anderen Events (inkl. `TOKEN_REFRESHED`, `INITIAL_SESSION`, etc.) → nur `setSession(s)` ohne User/Role-Änderung
- **Niemals** `setLoading(true)` im Listener setzen

### 2. Dashboard (`src/pages/Dashboard.tsx`)
- `useEffect` Dependency von `user` auf `user?.id` ändern → verhindert Reload bei gleicher User-ID aber neuer Objekt-Referenz
- `loadAssignments` soll beim Reload **nicht** `setLoading(true)` setzen wenn bereits Daten vorhanden sind (nur beim ersten Laden)

### 3. Supabase Client (`src/integrations/supabase/client.ts`)
- `detectSessionInUrl: false` hinzufügen um unnötige Session-Checks beim Fokus zu verhindern

## Dateien
- `src/contexts/AuthContext.tsx`
- `src/pages/Dashboard.tsx`  
- `src/integrations/supabase/client.ts`

