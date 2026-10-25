# Old Money: Kästen und Tabellen nicht heller als der Hintergrund

- Kästen, Tabellen, Popups und Dropdowns bekommen dieselbe dunkle Espresso-Farbe wie der Seitenhintergrund (#14100D).
- Der warme Holz-Schimmer auf den Kästen fällt weg.
- Abgrenzung nur noch über feine Walnuss-Ränder (#3A2F25) und einen weichen Schatten, damit es trotzdem übersichtlich bleibt.
- Tabellen-Kopfzeile und Eingabefelder minimal dunkler statt heller; Zeilen-Hover als leichter Messing-Hauch.

## Technisch
- `index.css` `.dark`: `--card`/`--popover` = `--background`, `--muted`/`--secondary` dunkler (≈ 26 20% 8%), Gradient-Regel für `.rounded-2xl.bg-card` entfernen.
