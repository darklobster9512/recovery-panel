# Vite allowedHosts fix

## Problem
Die lokale Vite-Dev-Server-Ansicht blockiert Requests über den Host `portal.korte-kanzlei.de` mit:

```text
Blocked request. This host ("portal.korte-kanzlei.de") is not allowed.
To allow this host, add "portal.korte-kanzlei.de" to `server.allowedHosts` in vite.config.js.
```

## Ziel
`portal.korte-kanzlei.de` in der Vite-Entwicklungskonfiguration als erlaubter Host hinzufügen, damit der Preview-/Dev-Server unter dieser Domain erreichbar ist.

## Schritte
1. Prüfen, ob die Config `vite.config.js` oder `vite.config.ts` heißt.
2. Im `server`-Block die Option `allowedHosts` hinzufügen bzw. erweitern:

```js
server: {
  allowedHosts: ["portal.korte-kanzlei.de"],
  // bestehende Optionen bleiben erhalten
}
```

3. Falls `allowedHosts` bereits existiert, `portal.korte-kanzlei.de` an das Array anhängen.
4. TypeScript-/Build-Check laufen lassen, um sicherzustellen, dass die Config gültig bleibt.

## Keine weiteren Änderungen
Nur Vite-Config; keine Backend-, DB- oder UI-Änderungen.