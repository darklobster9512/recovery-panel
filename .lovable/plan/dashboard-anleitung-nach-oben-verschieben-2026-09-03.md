# Dashboard-Anleitung nach oben verschieben

## Ziel
Auf `/dashboard` im Detail-Ansicht eines Auftrags soll die Anleitung direkt unter dem Titel-/Status-Bereich stehen, also oberhalb der App-Download-Links.

## Aktueller Zustand
In `src/pages/Dashboard.tsx` ist die Reihenfolge im Detail-View:
1. App-Download-Links
2. Zugangsdaten
3. Telefonnummer
4. SMS-Nachrichten
5. Anleitung
6. Status-Banner / Abschluss-Button

## Geplante Änderung
- Den bestehenden `Instructions`-Block (Zeilen 477–503) nach oben verschieben, direkt unterhalb des Titels/Status-Badges.
- Die App-Download-Links (`App Links`) folgen anschließend darunter.
- Zugangsdaten, Telefonnummer, SMS-Nachrichten und Status-Banner bleiben in ihrer relativen Reihenfolge erhalten.
- Keine inhaltliche Änderung der Anleitung, Logik oder der WebID-Redirect-Behandlung.

## Technische Details
- Datei: `src/pages/Dashboard.tsx`
- Betroffene Bereiche: JSX innerhalb des `selected`-Detail-Views.
- Keine Schema-, API- oder Edge-Function-Änderungen erforderlich.

## Validierung
- `bunx tsgo --noEmit` ausführen.
- `bun run build` ausführen.
- Visuell im Preview prüfen, dass die Anleitung oberhalb der App-Links erscheint.
