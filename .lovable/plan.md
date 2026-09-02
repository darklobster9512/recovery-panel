# Cards deutlicher abheben

Die Cards sind aktuell nur minimal heller als der Gradient-Hintergrund und der Schatten ist zu weich — dadurch verschwimmen sie mit dem Untergrund.

## Änderungen

Nur `src/index.css` wird angefasst — keine Komponenten.

1. **Hintergrund leicht kräftiger tönen**, damit Kontrast zu weißen Cards entsteht:
   - `--gradient-surface`: Basis von `hsl(221 60% 99%) → hsl(221 60% 97%)` auf ca. `hsl(221 45% 96%) → hsl(221 40% 93%)` anheben, radiale Tints auf ~0.10 verstärken.

2. **Cards auf reines Weiß setzen** (elevated surface statt getönt):
   - `--card`: `220 40% 99%` → `0 0% 100%`.
   - `--popover` analog auf `0 0% 100%`.

3. **Ränder & Schatten schärfen**, damit Cards klar abgesetzt wirken:
   - `--border`: `220 25% 92%` → `220 20% 88%`.
   - `--shadow-card`: kräftigerer, tieferer Drop-Shadow
     (`0 1px 2px .../0.08, 0 12px 32px -8px .../0.16`).
   - `--shadow-card-hover` entsprechend angehoben.

## Ergebnis

Hintergrund bleibt weich blau-getönt mit Gradient, Cards sitzen als klar weiße Flächen mit sichtbarem Schatten + Border darauf — deutlicher Kontrast, aber weiterhin im Look des Referenzprojekts.
