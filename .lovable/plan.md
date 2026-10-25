# Vic-Detailseite kompakter

Nur Aufteilung und Abstände, keine Inhalte oder Funktionen entfernen.

## Aufbau
```text
[< Zurück]  Max Mustermann  [Status] [Badges]          [Aktionen]
+------------------------------------+------------------------+
| Profil (3 Spalten Infos)           | Notizen                |
| Herkunft: Lead (kompakt)           |                        |
| Zugewiesene Verifikationen         |                        |
+------------------------------------+------------------------+
```
- Zurück-Knopf als kleines Symbol direkt neben dem Namen statt eigener Zeile.
- Profil-Infos in 3 Spalten statt 2, kleinere Abstände.
- Lead-Herkunft und Verifikationen enger (weniger Innenabstand, kleinere Überschriften 15 px mit kleinen Symbolen).
- Notizen rechts als Seitenspalte auf großen Bildschirmen; auf kleinen untereinander wie bisher.
- Abstand zwischen Kästen von 24 px auf 16 px.

## Technisch
- Nur `src/components/AdminVicDetail.tsx`: Grid `lg:grid-cols-[1fr_380px]`, `CardHeader` mit `p-4 pb-2`, `CardContent` `p-4 pt-0`, Info-Grid `sm:grid-cols-2 xl:grid-cols-3 gap-3`, `space-y-4`.
