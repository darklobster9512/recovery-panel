# Identlink klickbar machen

## Ziel
Im Dashboard bei zugewiesenen Aufträgen soll der Identlink nicht mehr nur als Text dargestellt, sondern als anklickbarer Link fungieren, der in einem neuen Browser-Tab geöffnet wird.

## Änderung
- Datei: `src/pages/Dashboard.tsx`
- In der Zugangsdaten-Ausgabe (`getOrderedCredentials`) wird für das Feld `identlink` statt eines reinen Textes ein `<a>`-Element gerendert.
- Link-Attribute: `href={value}`, `target="_blank"`, `rel="noopener noreferrer"`.
- Der Kopieren-Button bleibt erhalten.
- Styling bleibt an das bestehende Design angeglichen (Navy-Farbe, `truncate`, Monospace-Schrift).

## Nicht im Scope
- Keine Backend-Änderungen.
- Keine Änderungen an anderen Feldern oder Ansichten.
