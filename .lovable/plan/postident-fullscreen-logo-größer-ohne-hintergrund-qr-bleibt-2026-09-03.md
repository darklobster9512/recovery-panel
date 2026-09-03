# Postident-Fullscreen: Logo größer, ohne Hintergrund, QR bleibt zentriert

## Ziel
Im Postident-Vollbild-Lightbox soll das Auftrags-Logo größer und ohne Hintergrund dargestellt werden. Der QR-Code selbst soll weiterhin exakt mittig im Viewport zentriert bleiben; das Logo wird unten angehängt und verschiebt den QR-Code nicht nach oben.

## Betroffene Datei
- `src/pages/Dashboard.tsx`

## Änderungen
1. Den Lightbox-Container wieder auf `flex items-center justify-center` setzen, damit das Code-Bild allein im Viewport-Zentrum ausgerichtet wird.
2. Das Code-Bild behält seine zentrale Position und die aktuellen Größen-/Rahmen-Stile.
3. Das Auftrags-Logo wird als separates, absolut positioniertes Element am unteren Bildschirmrand eingefügt:
   - `absolute bottom-8 left-1/2 -translate-x-1/2`
   - Größe deutlich vergrößert, z. B. `w-48 h-24 object-contain`
   - Kein Hintergrund, kein Padding, ggf. ein feiner `drop-shadow` für Kontrast auf dem dunklen Overlay
   - Klick-Propagation wird gestoppt, damit ein Klick auf das Logo den Lightbox nicht schließt.
4. Schließen-Button und Klick-Outside-Verhalten bleiben unverändert.

## Nicht im Scope
- Keine Backend-, Storage- oder Auth-Änderungen.
- Keine Änderung an der Code-Extraktion oder dem normalen Postident-Preview.

## Verifikation
- `bunx tsgo --noEmit` und `bun run build` erfolgreich.
- Preview: Postident-Auftrag → Code im Vollbild öffnen → QR-Code bleibt mittig, Logo erscheint größer und ohne Hintergrund unten mittig.
