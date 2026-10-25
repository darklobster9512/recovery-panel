# Reiterwechsel wieder schnell machen

## Ursache (im Code geprüft)
Jeder Reiter ist eine eigene Seite, die das ganze Admin-Panel neu aufbaut. Dabei werden jedes Mal zuerst die Brandings neu geladen; solange das läuft, bleibt der Inhalt leer. Erst danach startet die Seite mit dem Laden ihrer Daten, und viele Seiten holen zusätzlich noch einmal die Liste aller Vics der Marke. Diese Abfragen laufen also nacheinander statt einmal.

## Änderungen
- Brandings werden nur einmal geladen und dann gemerkt. Beim Reiterwechsel ist die Marke sofort da, der Inhalt startet ohne Wartezeit. Im Hintergrund wird still aktualisiert.
- Die Liste "welche Vics gehören zur Marke" wird pro Marke kurz (ca. 1 Minute) gemerkt und zwischen den Reitern geteilt. Beim Markenwechsel oder nach dem Anlegen/Ändern eines Vics wird sie neu geholt.
- Sonst ändert sich nichts an Inhalt oder Rechten.

## Technisch
- `BrandingContext.tsx`: Modul-Cache für `brandings`; `ready` sofort true, wenn Cache vorhanden; Hintergrund-Reload. Beim Speichern in `AdminBrandings` Cache aktualisieren.
- `src/lib/branding.ts`: `fetchBrandingProfileIds` mit Cache pro `brandingId` (TTL 60 s, laufende Anfrage wird geteilt) + `invalidateBrandingProfileIds()`; Aufruf nach Vic-Erstellung/Branding-Änderung.
- Danach Ladezeit eines Reiterwechsels im Browser messen, soweit ohne Login möglich.
