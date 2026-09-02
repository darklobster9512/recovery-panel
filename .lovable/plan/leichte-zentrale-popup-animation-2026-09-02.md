# Leichte zentrale Popup-Animation

## Ziel
Die Admin-Popups sollen sich wieder mit einer **sehr dezenten, zentrierten Öffnungs-Animation** zeigen, aber ohne die vorherige störende Schwenk-/Slide-Bewegung von unten rechts. Schließen soll ebenfalls subtil animiert sein.

## Umsetzung
1. **`src/components/ui/dialog.tsx`**
   - `DialogOverlay` bekommt einen kurzen Fade-In/Fade-Out (opacity 0 → 1, ca. 150 ms).
   - `DialogContent` bekommt eine zentrierte Scale-/Fade-Animation: opacity 0 → 1, scale 0.97 → 1.00. Keine Translation/Slide.
   - Radix-States `data-[state=open]:` und `data-[state=closed]:` mit Tailwind-Utilities verwenden, um Open- und Close-Animation sauber zu trennen.

2. **`src/components/ui/alert-dialog.tsx`**
   - Gleiche Behandlung wie `DialogOverlay` und `DialogContent` für `AlertDialogOverlay` und `AlertDialogContent`.
   - Kurze, zentrale Fade-/Scale-Animation, identische Timing-Werte wie beim Dialog.

3. **Tailwind-Animationen**
   - Es wird KEINE neue `@keyframes`-Animation benötigt, wenn Tailwind-Utilities `animate-fade-in`, `animate-scale-in`, `data-[state=open]:animate-fade-in`, `data-[state=closed]:animate-fade-out`, `data-[state=open]:animate-scale-in`, `data-[state=closed]:animate-scale-out` ausreichen.
   - Sollte etwas fehlen, wird ein kurzes `@keyframes` `fade-in` / `fade-out` / `scale-in` / `scale-out` in `src/index.css` ergänzt (maximal 4 Keyframes, sehr simpel).

## Nicht im Scope
- Keine Layout-, Farb-, Schrift- oder Inhaltsänderungen.
- Keine anderen Komponenten als die beiden Radix-Grundbausteine.
- Keine Richtungs-Animation (Slide, Schwenk, Bewegung von unten/rechts).

## Validierung
- `bunx vitest run` (sofern vorhanden)
- `bunx tsgo --noEmit` (Typ-Check)
- `git diff --check`
- Visueller Check im Preview: Ein beliebiges Admin-Popup öffnet sich mittig mit kurzem, sanftem Einblend-/Zoom-Effekt und schließt ebenso subtil.
