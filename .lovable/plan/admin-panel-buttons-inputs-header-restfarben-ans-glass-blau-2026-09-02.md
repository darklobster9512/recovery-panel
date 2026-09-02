# Admin-Panel: Buttons, Inputs, Header & Restfarben ans Glass/Blau-Theme angleichen

Der letzte Redesign-Schritt hat Cards, Dialoge und Popovers auf die Sidebar-Farbe plus blaue Akzente umgestellt. Buttons, Inputs, der obere Header sowie einige hart­codierte grau/weiße Stellen fallen noch aus dem Bild. Diese Runde macht das komplette Admin-Panel visuell konsistent.

## Was geändert wird

### 1. Header (sticky top bar in `AdminPanel.tsx`)
- Hintergrund von `bg-background/70` auf die Card/Sidebar-Farbe mit leichter Transparenz (`bg-card/80`) plus stärkerem `backdrop-blur`.
- Untere Kante als dezenter blauer Verlauf statt reiner Border (feine 1px Border in `border-primary/10` + `shadow-sm`).
- Trigger-Button und Titeltext bekommen konsistente Muted/Foreground-Töne.

### 2. Buttons (`components/ui/button.tsx`)
- `default`: Farbverlauf `--gradient-primary` (Primary → Primary-Glow), weiche blaue Shadow (`shadow-soft`), leichter Hover-Lift.
- `outline`: Hintergrund auf Card-Ton (`bg-card/60`), Border `border-primary/20`, Hover `bg-accent` mit `border-primary/40`.
- `secondary`: bleibt, nur mit weicher Border und Hover-Akzent.
- `ghost`: Hover in blauem Accent-Ton statt neutral.
- Übergänge auf `transition-all` mit sanftem Farbwechsel.

### 3. Inputs (`components/ui/input.tsx`)
- Hintergrund `bg-card/60` statt `bg-background` — passt zur Glasfläche.
- Border `border-border/70`, Fokus-Ring in Primary mit sanftem Glow (`ring-primary/40` + `border-primary`).
- Hover: `border-primary/40`.
- Placeholder in `text-muted-foreground/70`.
- Gleiche Behandlung auf Textarea und Select-Trigger übertragen, damit alles einheitlich wirkt.

### 4. Hart­codierte Grau/Weiß-Stellen im Admin
Ersetzen mit semantischen Tokens, ohne Logik zu ändern:
- `AdminDashboard.tsx`: `text-gray-500` / `text-gray-400` → `text-muted-foreground`.
- `AdminSettings.tsx`: `text-gray-700` / `text-gray-500` → `text-foreground` bzw. `text-muted-foreground`; Section-Überschriften bekommen dezenten blauen Icon-Akzent.
- `AdminEmailTemplates.tsx`: Preview-`iframe` behält `bg-white` (E-Mail-Rendering muss weiß bleiben), Rahmen darum in Card-Style.

Auth-Seite und `ProtectedRoute` werden **nicht** angefasst — Fokus ist das Admin-Panel.

## Technische Details

- Alle Farbänderungen laufen über bereits definierte HSL-Tokens in `src/index.css` (`--card`, `--primary`, `--primary-glow`, `--accent`, `--border`, `--shadow-soft`, `--gradient-primary`). Keine neuen Tokens nötig.
- Button-`default` nutzt `bg-gradient-to-br from-primary to-primary-glow` — funktioniert mit shadcn cva ohne Struktur­änderung.
- Betroffene Dateien: `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/textarea.tsx`, `src/components/ui/select.tsx`, `src/pages/AdminPanel.tsx`, `src/components/AdminDashboard.tsx`, `src/components/AdminSettings.tsx`, `src/components/AdminEmailTemplates.tsx`.
- Kein Logik-Change, keine DB-Migration, keine Edge-Function-Änderung.

## Verifikation

Nach dem Umbau ein Playwright-Screenshot von `/admin`, `/admin/verifikationen` und dem Neuer-Nutzer-Popup, um zu bestätigen, dass Header, Buttons und Inputs zum Glass/Blau-Look der Cards passen.
