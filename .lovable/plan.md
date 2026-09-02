# Admin-Cards wirken weiterhin weiß

## Ursache
`--card` steht in `src/index.css` auf `0 0% 100%` (reines Weiß) — identisch mit `--background`. Dadurch heben sich Cards nicht vom Gradient-Hintergrund ab und wirken wie flache weiße Kästen, egal welche Utility-Klassen die Komponenten bekommen. `--popover` hat dasselbe Problem.

Die vorher gesetzten Utility-Klassen (`bg-card`, `shadow-card`, `border-border/60`) greifen also korrekt — der Token dahinter ist nur nicht getönt.

## Lösung (nur `src/index.css`)

1. **Card-Token leicht tönen**, damit sie sich vom Gradient absetzen, ohne grau zu wirken:
   - `--card: 220 40% 99%` (Hauch Blau/Kalt-Weiß)
   - `--popover: 220 40% 99%`
2. **Glass-Variante** als optionale Utility für Hero-/Stat-Cards:
   - Neue Klasse `.card-glass` = `bg-card/70 backdrop-blur-xl border-white/60 shadow-card`
3. **Shadow etwas kräftiger**, damit die Tönung + Schatten die Card deutlich vom Surface abheben:
   - `--shadow-card` von `0 1px 2px … / 0.04, 0 4px 16px -4px … / 0.06`
     → `0 1px 2px hsl(220 40% 20% / 0.06), 0 8px 24px -6px hsl(220 40% 20% / 0.10)`
4. **Border-Token** minimal kühler (`--border: 220 25% 92%`), damit Card-Rand sichtbar bleibt.

Kein Eingriff in einzelne Komponenten nötig — alle Cards, Dialoge, Popover, Selects erben die neuen Werte automatisch. E-Mail-Preview-iframe bleibt unberührt (rendert eigenes HTML).

## Verifikation
Nach dem Save Preview auf `/admin/dashboard`, `/admin/leads`, `/admin/einstellungen` prüfen: Cards sollten jetzt einen sichtbaren, warmen Kontrast zum Gradient-Surface haben.
