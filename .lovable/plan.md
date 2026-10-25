# Logos größer, Name rechts daneben (/admin/verifikationen)

```text
+------------------------------------+
| [ Logo ]  Deutsche Bank        [✎] |
| [ 56px ]  Postident                |
| [ + Zuweisen                     ] |
+------------------------------------+
```

- Logo von 32 px auf 56 px, links in der Kachel.
- Bankname (darf umbrechen, nie abgeschnitten) und darunter Postident / Video-Ident rechts neben dem Logo.
- Stift bleibt oben rechts, „Zuweisen“-Button volle Breite unten.
- Raster etwas breiter (max. 4 Kacheln pro Reihe statt 6), damit die Namen genug Platz haben.

## Technische Details
- Nur Kachel-Markup in `src/components/AdminVerifications.tsx`: Kopfzeile wird `flex items-center gap-3` mit Logo (`h-14 w-14`) + Textblock (Name + Zusatz), Stift absolut oben rechts; Raster `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4`.
