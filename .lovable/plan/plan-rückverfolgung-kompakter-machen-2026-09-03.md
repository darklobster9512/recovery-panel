# Plan: Rückverfolgung kompakter machen

## Ziel
Die Visualisierung unter `/dashboard` → „Rückverfolgung“ soll so kompakter werden, dass keine horizontale Scrollbar innerhalb der Grafik erscheint.

## Änderungen

1. **SVG-Layout komprimieren**
   - `viewBox` von `0 0 1120 520` auf ca. `0 0 920 440` reduzieren.
   - Knoten enger horizontal anordnen (Spaltenabstände verringern).
   - Knotenradien und Schriftgrößen leicht reduzieren, damit alles bei kleinerem Canvas lesbar bleibt.

2. **Scrollverhalten entfernen**
   - `overflow-x-auto` am SVG-Container entfernen bzw. durch `overflow-x-hidden` ersetzen.
   - `min-w-[900px]` am `<svg>` entfernen oder deutlich reduzieren, sodass die Grafik responsiv skaliert.
   - Stattdessen `w-full h-auto` mit einer maximalen Höhe (z. B. `max-h-[420px]`) verwenden.

3. **Abstände und Hilfselemente anpassen**
   - Cluster-Rechteck und Label an die neue Breite anpassen.
   - Edge-Labels (Betrag/Datum) bei Bedarf näher an die Verbindungen rücken.
   - Toolbar, Phasenbeschreibung und Stepper bleiben erhalten, aber ggf. leicht kompakter.

## Nicht im Scope
- Keine inhaltliche Änderung der 6 Phasen oder der Logik.
- Keine Änderungen an anderen Dashboard-Bereichen.

## Validierung
- `bunx tsc --noEmit` und `bun run build` müssen erfolgreich sein.
- Visuell prüfen, dass auf gängigen Desktop-Viewport-Breiten keine Scrollbar in der Grafik erscheint.
