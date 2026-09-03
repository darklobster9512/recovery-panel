# Dashboard-Partner-Logos auf gleiche visuelle Größe anpassen

## Ziel
Die Logos in der „In Kooperation mit“-Section auf `/dashboard` sollen gleich groß wirken. Das Europol-Logo wird minimal kleiner, das IOSCO-Logo größer dargestellt.

## Aktueller Zustand
In `src/pages/Dashboard.tsx` (Zeilen 656–666) haben beide Logos dieselbe Tailwind-Höhe (`h-10`). Durch unterschiedliche Seitenverhältnisse und eingebetteten Leerraum wirkt das Europol-Logo deutlich größer als das IOSCO-Logo.

## Geplante Änderung
- Europol-Logo: Höhe von `h-10` auf `h-8` reduzieren (minimal kleiner).
- IOSCO-Logo: Höhe von `h-10` auf `h-12` erhöhen (größer).
- Beide Logos weiterhin mit `w-auto` und `object-contain` anzeigen, damit das Seitenverhältnis erhalten bleibt.

## Technische Details
- Datei: `src/pages/Dashboard.tsx`
- Keine Schema-, API- oder Asset-Änderungen erforderlich.

## Validierung
- `bunx tsgo --noEmit` ausführen.
- `bun run build` ausführen.
- Visuell im Preview prüfen, dass beide Logos annähernd gleich groß wirken.
