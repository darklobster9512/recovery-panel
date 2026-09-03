# Postident-Fullscreen: Auftrags-Logo unter dem Code anzeigen

## Ziel
Wenn der Vic im `/dashboard` den extrahierten Postident-Code im Vollbild-Lightbox öffnet, soll unter dem vergrößerten Code das Logo des zugewiesenen Auftrags mittig im abgedunkelten Hintergrund eingeblendet werden.

## Betroffene Datei
- `src/pages/Dashboard.tsx`

## Änderungen
1. Den bestehenden Lightbox-Container (`fixed inset-0 z-50 bg-black/80 ...`) von einem einzelnen `<img>` auf eine vertikale Flex-Box umstellen (`flex-col items-center justify-center gap-6`).
2. Das Code-Bild bleibt zentriert und behält seine aktuellen Größen-/Rahmen-/Schatten-Stile.
3. Unter dem Code wird eine `<VerificationLogo>`-Komponente gerendert:
   - Zentriert via `items-center`/`text-center` bzw. `mx-auto`.
   - Weißer/light Hintergrund, damit es auf dem dunklen Overlay lesbar ist (z. B. `bg-white rounded-xl p-3 shadow-xl`).
   - Feste Größe `w-32 h-16` oder ähnlich, `object-contain`.
   - `alt` aus `selected.verification?.title`.
4. Klick-Outside-Verhalten bleibt erhalten: der äußere Container schließt beim Klick auf den dunklen Bereich; Bild und Logo stoppen die Propagation.

## Nicht im Scope
- Keine Backend-, Storage- oder Auth-Änderungen.
- Keine Änderung an der Code-Extraktion oder dem normalen Postident-Preview.

## Verifikation
- `bunx tsgo --noEmit` und `bun run build` erfolgreich.
- Preview: Postident-Auftrag öffnen → auf Code klicken → Logo erscheint zentriert unter dem vergrößerten Code im dunklen Bereich.
