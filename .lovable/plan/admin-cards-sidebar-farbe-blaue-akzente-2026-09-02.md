# Admin Cards: Sidebar-Farbe + blaue Akzente

Ziel: Die Cards im Admin-Panel bekommen die gleiche zarte Blau-Weiß-Fläche wie die Sidebar und werden durch dezente blaue Akzente (Border-Left, Icon-Badges, Hover-Glow) aufgewertet.

## Änderungen

### 1. `src/index.css` – Token-Anpassung
- `--card` von `216 45% 97%` auf **`221 80% 98%`** (identisch zu `--sidebar-background`).
- `--popover` analog auf `221 80% 98%` für einheitliches Glas-Feeling.
- `--border` leicht bläulicher: `221 40% 88%` (näher am Sidebar-Border).
- `--shadow-card` und `--shadow-card-hover` mit leicht blauem Tint (`221 60% 40%` statt neutralem Grau) für den Akzent.
- Neue Utility-Klasse `.card-accent` in `@layer components`:
  - `border-l-2 border-l-primary/40`
  - Hover: `border-l-primary` + weicher blauer Glow (`shadow-soft`).

### 2. `src/components/ui/card.tsx`
- Grundklasse ergänzen: statt reinem `bg-card/85` → `bg-card` (voll deckend, damit es exakt wie die Sidebar wirkt) mit `backdrop-blur-xl` beibehalten.
- Optionale linke Akzentkante über die neue `.card-accent`-Utility, standardmäßig aktiv im Admin (Cards, die im Admin-Layout gerendert werden, erben es automatisch, da die Utility global via className angehängt wird).

### 3. `src/components/admin/DialogShell.tsx`
- Icon-Badge (aktuell `bg-primary/10`) verstärken auf `bg-primary/15` mit `ring-1 ring-primary/20`, damit die blauen Akzente sichtbar sind.
- Footer-Divider dünn blau tinten (`border-primary/10`).

## Nicht geändert
- Sidebar selbst, Buttons, Typo, Layout.
- Keine Änderungen an Business-Logik oder anderen Komponenten.

## Ergebnis
Cards und Sidebar verschmelzen visuell zu einer Fläche; blaue Akzentkanten und Icon-Badges heben interaktive Bereiche hervor, ohne laut zu wirken.
