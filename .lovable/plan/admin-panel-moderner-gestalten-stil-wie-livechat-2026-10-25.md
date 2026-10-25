# Admin-Panel moderner gestalten (Stil wie Livechat)

Nur Optik, keine Funktionsänderung. Hell, Primär-Blau bleibt.

## Überall gleich (wirkt auf alle Seiten)
- Kacheln/Kästen: stärker abgerundet (wie Livechat), weicher Schatten, feinerer Rand.
- Tabellen: Kopfzeile klein, grau, in Großbuchstaben auf hellem Grund; feine helle Trennlinien zwischen Zeilen; sanfter Hover; etwas mehr Luft.
- Suchfelder und Eingaben: abgerundet, leicht grauer Hintergrund, beim Klicken weiß mit blauem Rand.
- Knöpfe: etwas runder; Status-Abzeichen als weiche Pillen (heller Farbton + farbige Schrift statt kräftiger Fläche).
- Reiter (Tabs): als Pillen-Leiste.
- Fenster (Popups): runder, mehr Innenabstand.
- Blättern (20 pro Seite): kompakte, runde Knöpfe.

## Seitenleiste
- Menüpunkte als abgerundete Pillen; aktiver Punkt hellblau mit blauer Schrift und Symbol.
- Gruppenüberschriften klein und grau, mehr Abstand zwischen Gruppen.
- Branding-Kasten oben und Nutzerbereich unten passend abgerundet.

## Kopfbereich & Seiten
- Oben einheitlicher Seitentitel (groß, fett) mit kurzem grauen Untertitel.
- Seitenhintergrund leicht grau, damit die weißen Kästen hervortreten.
- Namen in Listen (Leads, Vics, Caller) mit rundem Initialen-Bild wie im Livechat.

## Technisch
- Grundbausteine anpassen: `ui/card`, `ui/table`, `ui/input`, `ui/textarea`, `ui/select`, `ui/button`, `ui/badge`, `ui/tabs`, `ui/dialog`, `TablePagination`; Tokens (Radius, Schatten) in `index.css`.
- `AdminPanel.tsx`: Sidebar-Menü, Header, Hintergrund.
- Initialen-Avatar als kleiner gemeinsamer Baustein, eingebaut in Leads/Vics/Caller-Tabellen.
- Danach Seiten per Screenshot prüfen, soweit ohne Login möglich (Login-Seite bleibt unverändert).
