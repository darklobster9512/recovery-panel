# Popup-Background: Dunkel ohne Blur

## Ziel
Der Hintergrund hinter Admin-Popups soll abgedunkelt bleiben, aber keinen Blur-Effekt mehr haben. Der Fokus soll auf dem Popup liegen, nicht auf dem Hintergrund.

## Umsetzung

### 1. `src/components/ui/dialog.tsx`
- `DialogOverlay`:
  - `backdrop-blur-[2px]` entfernen.
  - Hintergrundfarbe beibehalten/ersetzen durch einheitliches dunkles Overlay, z.B. `bg-black/55` (oder `bg-foreground/55` falls ohne Blur ausreichend Kontrast).
  - Animationsklassen `data-[state=open]:animate-overlay-enter` und `data-[state=closed]:animate-overlay-exit` beibehalten.

### 2. `src/components/ui/alert-dialog.tsx`
- `AlertDialogOverlay`:
  - `bg-black/80` ohne Blur beibehalten; falls ein anderer Blur-Filter vorhanden ist, entfernen.
- `AlertDialogContent`:
  - `backdrop-blur-xl` entfernen.
  - Hintergrund bleibt opak über `bg-card` (statt `bg-card/95`) oder ein sehr leichter Transparenz-Wert, aber ohne Blur.
  - Animationsklassen beibehalten.

### 3. Design-Token (optional, falls sinnvoll)
- In `src/index.css` kann eine neue CSS-Variable `--overlay` als `hsl(214 69% 14% / 0.55)` ergänzt werden, um beide Overlays konsistent zu färben. Falls nicht nötig, bleibt der Scope auf den beiden Dialog-Komponenten.

## Nicht im Scope
- Keine Änderung der Öffnungs-/Schließ-Animation (zentrierte Fade-/Scale-Animation bleibt).
- Keine Änderungen an Dialog-Content-Design, Farben, Schrift oder Layout.
- Keine Änderungen an Dropdowns, Popovers, Toasts oder Tooltips.

## Validierung
- `bunx vitest run`
- `bunx tsgo --noEmit`
- Visueller Check: Ein beliebiges Admin-Popup öffnen. Hintergrund ist dunkel, aber nicht verschwommen (kein `backdrop-blur`).