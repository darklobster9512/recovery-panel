

# Fix: Vite Allowed Hosts

## Problem
Vite blockiert Requests vom Host `web.bovensiepenpartner.de`, da er nicht in der erlaubten Liste steht.

## Lösung in `vite.config.ts`
`server.allowedHosts` um `web.bovensiepenpartner.de` erweitern:

```ts
server: {
  host: "::",
  port: 8080,
  allowedHosts: ["web.bovensiepenpartner.de"],
  hmr: { overlay: false },
},
```

### Dateien
- `vite.config.ts`

