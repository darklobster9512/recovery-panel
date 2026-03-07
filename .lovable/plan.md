

# Dashboard Redesign — Landing-Page Style

## Konzept
Das `/dashboard` wird komplett umgestaltet: Weg von der aktuellen Listen-/Progress-Ansicht, hin zu einem modernen, hellen Landing-Page-artigen Layout (inspiriert vom Attendflow.io Landing-Stil). Grosser Begrüssungstext, kurze Einleitung, und die Verifikations-Aufträge als quadratische Cards in einem Grid — daneben "Demnächst verfügbar"-Platzhalter-Cards.

## Aufbau der neuen Seite

### Header (minimal)
- Links: Logo/Name ("RecoveryPanel")
- Rechts: Abmelden-Button
- Wie bisher, schlank und clean

### Hero-Bereich
- Grosser, fetter Headline-Text: z.B. "Willkommen zurück" oder "Dein Dashboard"
- Darunter ein kurzer, grauer Einleitungstext der erklärt was der Nutzer hier tun soll (seine zugewiesenen Verifikationen durchführen)
- Viel Whitespace, zentriert, max-w-5xl

### Verifikations-Grid
- CSS Grid: `grid-cols-2 sm:grid-cols-3` — quadratische Cards
- **Echte Aufträge**: Quadratische Card mit Logo (gross, zentriert), Titel darunter, Status-Badge. Hover-Effekt mit leichtem Shadow/Border-Highlight. Klick öffnet Detail-View.
- **Platzhalter-Cards**: 2-3 Stück daneben, gleiche Grösse, leicht ausgegraut mit gestricheltem Border, Text "Demnächst verfügbar" zentriert. Subtil und seriös.
- Kein Progress-Bar nirgendwo in der Übersicht.
- `aspect-square` für quadratische Proportionen

### Detail-View (beim Klick)
- Bleibt funktional wie bisher: Zurück-Button, Zugangsdaten mit Copy, Instruktionen, App-Links, Telefonnummer
- Aber ohne Progress-Bar — stattdessen nur Status-Badge
- Smooth animated transition beibehalten

## Technische Änderungen

### `src/pages/Dashboard.tsx` — Komplett neu schreiben
- `STATUS_PROGRESS` Map und `Progress`-Import entfernen
- `totalProgress`/`completedCount` Berechnung entfernen
- Overview: Hero-Section + Grid mit quadratischen Cards + Platzhalter
- Detail: Wie bisher minus Progress-Bars
- Container auf `max-w-5xl` erweitern für Grid-Layout
- Platzhalter-Cards als statisches Array (3 Stück mit "Demnächst verfügbar")

### Keine DB-Änderungen nötig

