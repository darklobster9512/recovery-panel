# Angeforderte Verifikationen: ausgegraut statt „In Bearbeitung“-Abzeichen

- Das gelbe Abzeichen „In Bearbeitung – noch nicht verfügbar“ fällt weg.
- Stattdessen ist die ganze Karte ausgegraut: blasser, Logos in Graustufen, gestrichelter Rand. So sieht man auf einen Blick, dass sie noch nicht verfügbar ist. Der kleine Hinweis „Verfügbar in ca. 1–2 Stunden.“ bleibt.
- Fehlgeschlagene Anfragen bleiben wie bisher mit rotem „Fehlgeschlagen“ und Grund.

## Technisch
- `RequestVerificationsSection.tsx`: Badge für `in_bearbeitung` entfernen; Card bei diesem Status `opacity-60 grayscale border-dashed bg-muted/40`.
