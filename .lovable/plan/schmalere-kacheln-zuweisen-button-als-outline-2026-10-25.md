# Schmalere Kacheln, Zuweisen-Button als Outline

- Kacheln schmaler: mehr Kacheln pro Reihe (bis zu 5 auf breitem Bildschirm statt 4, 3 auf Laptop, 2 auf Tablet).
- Zuweisen-Button: weißer Hintergrund, blaue Umrandung, blaues Symbol und blauer Text. Beim Darüberfahren leicht hellblau hinterlegt.

## Technische Details
- `src/components/AdminVerifications.tsx`: Raster `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`; Button-Klassen `border border-primary bg-card text-primary hover:bg-accent`.
