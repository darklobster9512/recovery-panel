# Logo austauschen: Bovensiepen & Partner → Korte & Partner

## Ausgangslage

Im Dashboard wird aktuell ein Bild-Logo (`src/assets/bovensiepen-logo.png`) an zwei Stellen im Header angezeigt.

Das Referenzprojekt "neue-recovery" hat **kein Bild-Logo** — die Marke dort ist eine reine Text-Wortmarke in Serif-Schrift:

```text
Korte & Partner        (Serif, "&" mit 60% Deckkraft)
```

## Was gemacht wird

- Im Dashboard-Header beide `<img src={bovensiepenLogo}>` durch die Korte-&-Partner-Wortmarke ersetzen: Serif-Schrift, Größe passend zur bisherigen Logo-Höhe, "&" leicht abgeschwächt — identisch zum Referenzprojekt.
- Den nicht mehr genutzten Import und die Datei `src/assets/bovensiepen-logo.png` entfernen.
- Alt-Text/Label "Bovensiepen & Partner" entsprechend auf "Korte & Partner" anpassen.

Rein visuelle Änderung — keine Logik, keine Datenbank, keine anderen Seiten betroffen.

## Offen

Falls du stattdessen ein echtes Bild-Logo (PNG/SVG) für Korte & Partner willst, lade es hoch oder sag Bescheid — dann baue ich das Bild ein statt der Wortmarke.
