# Kompaktere Bank-Karten bei /admin/verifikationen

Aktuell ist jede Karte hoch (Logo oben, Name, Badge, großer Button darunter, mind. 172 px). Neu: schlanke Zeile pro Karte.

```text
[Logo]  Deutsche Bank             [Zuweisen] [✎]
        Postident
```

- Logo klein (36 px) links, Name und kleiner Typ-Punkt/Badge (Postident / Videocall) daneben in einer Zeile.
- „Zuweisen“ als kompakter Button rechts, Stift-Icon zum Bearbeiten immer sichtbar (nicht nur beim Hover, intuitiver und auch am Touch-Gerät nutzbar).
- Ganze Karte klickbar öffnet „Zuweisen“; Stift öffnet Bearbeiten.
- Höhe ca. 64 px statt 172 px, Raster mit 3 Spalten ab Laptop-Breite (4 bei sehr breit), 1 Spalte mobil.
- Kleine Filter-Chips über dem Raster: Alle / Postident / Videocall, und ein Zähler „12 Aufträge“.

## Technische Details
- Nur `src/components/AdminVerifications.tsx` (Kartenbereich, Zeilen ca. 224–272); Dialog und Zuweisungsverlauf bleiben unverändert.
- Filter als lokaler State, nur Anzeige (keine Datenänderung).
