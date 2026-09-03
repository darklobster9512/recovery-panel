# Partner-Logos auf gleiche Höhe und Ausrichtung korrigieren

## Ziel
Die Logos in der „In Kooperation mit“-Section auf `/dashboard` sollen exakt gleich groß und vertikal mittig nebeneinander ausgerichtet sein, ohne Versatz.

## Aktueller Zustand
In `src/pages/Dashboard.tsx` (Zeilen 656–666) haben Europol (`h-8`) und IOSCO (`h-12`) unterschiedliche Höhen. Der Flex-Container zentriert zwar die Flex-Items, aber durch die unterschiedlichen Höhen wirken die Logos versetzt und nicht harmonisch.

## Geplante Änderung
- Beide Logos auf dieselbe visuelle Höhe bringen, indem sie in Wrapper mit fester Höhe (`h-10`) platziert werden.
- Die Bilder selbst mit `max-h-full w-auto object-contain` skalieren, damit sie innerhalb der festen Höhe zentriert bleiben und ihr Seitenverhältnis behalten.
- Der Container behält `flex items-center justify-center gap-8 flex-wrap`.

## Technische Details
- Datei: `src/pages/Dashboard.tsx`
- Keine Schema-, API- oder Asset-Änderungen erforderlich.

## Validierung
- `bunx tsgo --noEmit` ausführen.
- `bun run build` ausführen.
- Visuell im Preview prüfen, dass beide Logos auf gleicher Höhe und vertikal zentriert nebeneinander stehen.
