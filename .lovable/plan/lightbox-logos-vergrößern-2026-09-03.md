# Lightbox-Logos vergrößern

## Ziel
Die beiden Logos in der Postident-Code-Vollbildansicht sollen deutlich größer dargestellt werden:
- **Postident-Logo** oberhalb des Codes vergrößern.
- **Auftragslogo** unterhalb des Codes vergrößern.
- Der Code bleibt zentriert und vollständig sichtbar.

## Schritte

1. **`src/pages/Dashboard.tsx` anpassen**
   - Postident-Logo: von `w-32 sm:w-40` auf `w-44 sm:w-56` bzw. `max-h-16 sm:max-h-20` erhöhen.
   - Auftragslogo: von `w-28 h-14 sm:w-32 sm:h-16` auf `w-40 h-20 sm:w-48 sm:h-24` erhöhen.
   - Ggf. den Abstand zwischen Logo und Code leicht anpassen, damit das Layout nicht zu gedrängt wirkt.

2. **Validierung**
   - `bunx tsgo --noEmit` ausführen.
   - `bun run build` ausführen.
   - Im Preview prüfen, dass beide Logos klar erkennbar größer sind und der Code nicht abgeschnitten wird.
