# Auth-Seite: Flackern der Logos verhindern

Aktuell erscheinen IOSCO- und Europol-Logo verzögert, weil die Bilder erst nach dem Seiten-Render nachgeladen werden.

## Lösung
- Beide Logos vor dem Anzeigen der Auth-Seite vorladen (`new Image()` in einem `useEffect`, `Promise.all` auf `onload`).
- Solange nicht geladen: nichts anzeigen (leerer weißer Bildschirm in derselben Hintergrundfarbe), damit kein sichtbares Nachladen entsteht.
- Sobald beide Logos geladen sind, wird die komplette Seite inklusive Logos in einem Rutsch gerendert.
- Zusätzlich `loading="eager"` und `decoding="sync"` auf den `<img>`-Tags setzen.

## Technische Details
- Datei: `src/pages/Auth.tsx`
- Neuer State `assetsReady`; Return `null` bis `true`.
- Preload-Logik nur einmal beim Mount.
