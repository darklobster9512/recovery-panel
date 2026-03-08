

# Fix: Tab-Wechsel verursacht Page Reload

## Problem
Beim Tab-Wechsel lädt die Seite neu. Zwei Ursachen:

1. **React Query's `refetchOnWindowFocus`** — Standardmäßig aktiviert, führt bei Tab-Wechsel zu automatischen Refetches
2. **Supabase Auth `onAuthStateChange`** — Kann bei Tab-Rückkehr eine Token-Refresh-Event auslösen, was `loading` auf `true` setzt

## Lösung

### 1. QueryClient konfigurieren (`src/App.tsx`)
`refetchOnWindowFocus: false` global deaktivieren:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});
```

### 2. AuthContext optimieren (`src/contexts/AuthContext.tsx`)
Beim `onAuthStateChange` nur `loading: true` setzen, wenn tatsächlich ein User-Wechsel stattfindet (nicht bei TOKEN_REFRESHED oder ähnlichen Events):

- Bei `SIGNED_IN` mit neuem User → loading
- Bei `SIGNED_OUT` → loading
- Bei `TOKEN_REFRESHED` → **kein loading**, nur Session aktualisieren

## Dateien
- `src/App.tsx` — QueryClient Konfiguration
- `src/contexts/AuthContext.tsx` — Auth-Event Handling optimieren

