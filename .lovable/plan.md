# Login-Seite: kein Korte-Flackern mehr bei anderen Marken

Aktuell zeigt die Login-Seite sofort „Korte & Partner“ als Standard an und tauscht erst danach auf die Marke der Domain (z. B. Berthold & Partner).

## Lösung
- Die Login-Seite erscheint erst, wenn feststeht, welche Marke zur Domain gehört, und deren Logo fertig geladen ist.
- Bis dahin bleibt der Bildschirm leer in der Hintergrundfarbe (wie schon beim Vorladen der IOSCO-/Europol-Logos), danach erscheint alles in einem Rutsch.
- „Korte & Partner“ wird nur noch angezeigt, wenn wirklich keine Marke zur Domain gefunden wird (z. B. Vorschau-Adresse).
- Die Markenabfrage startet schon beim Öffnen der App, damit die Wartezeit möglichst kurz ist.
- Sicherheitsnetz: Antwortet die Abfrage nach ca. 3 Sekunden nicht, erscheint die Seite trotzdem (mit Standard).

## Technische Details
- `src/hooks/usePageTitle.ts`: `getHostBranding()` liefert gecachtes Promise; zusätzlich in `src/main.tsx` einmal früh aufrufen (Prefetch).
- `src/pages/Auth.tsx`: neuer State `brandingReady`; `getHostBranding()` -> setBranding, dann `branding.logo_url` per `new Image()` vorladen; Timeout 3 s. Render `null` bis `assetsReady && brandingReady`.
- Seitentitel wird damit ebenfalls direkt korrekt gesetzt.
