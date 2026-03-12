

# Dashboard Animationen & AdminVics Klick-Verhalten

## 1. Dashboard (`src/pages/Dashboard.tsx`) — Smooth Einblend-Animation

Die Hauptcontainer bekommen fade-in/slide-up Animationen mit gestaffelten Delays:
- Header: sofort sichtbar (fade-in)
- Begrüßungstext: 100ms delay
- Auftrags-Grid / Detailansicht: 200ms delay
- Footer: 300ms delay

Umsetzung über Tailwind `animate-fade-in` Klassen (bereits in tailwind.config definiert) + CSS `animation-delay` via inline styles.

## 2. AdminVics (`src/components/AdminVics.tsx`) — Klick-Verhalten pro Spalte

Aktuell hat die gesamte `TableRow` einen `onClick → navigate`. Das wird entfernt und stattdessen:

- **Vorname, Nachname, Email**: `onClick` auf diesen `TableCell`s → `navigate(/admin/vics/:id)`, cursor-pointer
- **Telefon**: `onClick` → kopiert Nummer ins Clipboard, `e.stopPropagation()`, kein Navigate
- **Temp. Passwort**: Der bestehende Copy-Button bekommt `e.stopPropagation()`, die Zelle selbst auch → kein Navigate
- **Erstellt am**: Kein Klick-Verhalten
- **Neue Spalte am Ende**: Eye-Icon (`lucide-react` `Eye`) → `navigate(/admin/vics/:id)`

### Dateien
- `src/pages/Dashboard.tsx`
- `src/components/AdminVics.tsx`

