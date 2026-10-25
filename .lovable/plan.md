# Dunkles Design klarer und übersichtlicher

## Vermutliche Gründe für "schwammig"
- Kästen (#111) heben sich kaum vom Hintergrund (#0A0A0A) ab, Ränder (#1F1F1F) fast unsichtbar.
- Nebentext zu dunkel (54 % Helligkeit), dadurch wirkt alles grau in grau.
- Der hellblaue Schimmer oben auf den Kästen macht Flächen unscharf.
- Tabellenzeilen haben kaum sichtbare Trennlinien.

## Änderungen
- Klare Stufen: Hintergrund #0A0A0A, Kästen #141414, Felder/Tabellenkopf #1A1A1A, Hover #1F1F1F.
- Ränder deutlich sichtbar #2A2A2A, Tabellen-Trennlinien #222.
- Nebentext heller (#A1A1A1), Haupttext #FAFAFA, Tabellenkopf-Schrift #B5B5B5.
- Schimmer auf den Kästen entfernen, Flächen scharf und flach.
- Seitenleiste: Gruppenüberschriften heller, aktiver Punkt hellere Pille #1F1F1F plus schmaler hellblauer Strich links, damit man sofort sieht, wo man ist.
- Eingabefelder und Nebenknöpfe mit sichtbarem Rand, Fokus hellblau.
- Danach mit angemeldetem Admin per Screenshot prüfen (falls möglich), sonst die Login-Seite im dunklen Modus als Probe.

## Technisch
- `index.css` `.dark`-Tokens anpassen (card 8%, muted 10%, border 16%, muted-foreground 63%), Glow-Regel entfernen, Tabellen-Rand-Remap.
- `AdminPanel.tsx`: dark-Variante des aktiven Menüpunkts um linken Akzentstrich ergänzen; Gruppenlabel `dark:text-sidebar-foreground/60`.
