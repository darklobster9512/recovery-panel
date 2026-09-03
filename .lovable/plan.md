# Avatar-Position weiter nach unten versetzen

## Ziel
Das Avatar-Bild von Dr. Thomas Korte in der `/dashboard`-Sidebar soll weiter nach unten verschoben werden, damit das Gesicht besser zentriert im runden Bildausschnitt erscheint.

## Änderungen
- Datei: `src/pages/Dashboard.tsx`
- Das `object-position`-Attribut des Thomas-Korte-Avatars wird von `object-[center_30%]` auf einen stärker nach unten versetzten Wert angepasst, z. B. `object-[center_55%]` oder `object-[center_60%]`.
- Größe und runder Bildausschnitt (`w-12 h-12 rounded-full`) bleiben unverändert.

## Prüfung
- Visueller Check im Preview auf `/dashboard`.
- `bunx tsc --noEmit` und `bun run build`.

## Nicht im Scope
- Keine weiteren Sidebar-Änderungen.
- Keine Datenbank- oder Backend-Änderungen.
