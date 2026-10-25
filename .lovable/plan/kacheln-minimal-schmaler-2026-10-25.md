# Kacheln minimal schmaler

- Pro Reihe passt eine Kachel mehr (sehr breiter Bildschirm 5 statt 4, Laptop 4 statt 3, Tablet 3 statt 2). Dadurch wird jede Kachel etwas schmaler.
- Sonst bleibt alles gleich.

## Technische Details
- In `src/components/AdminVerifications.tsx` das Raster der Kacheln von `sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4` auf `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5` ändern.
