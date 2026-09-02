# Admin-Panel: Weiß + Blaue Sidebar (Auth-Look)

Das Admin-Panel wird optisch an die `/auth`-Seite angeglichen: reines Weiß als Grundfläche, saubere Cards ohne blaue Glas-Tönung, und eine komplett in Primary-Blau gefüllte Sidebar mit weißen Text-/Icon-Akzenten.

## Änderungen

### 1. Farbtokens (`src/index.css`)
- `--background`, `--card`, `--popover` zurück auf reines Weiß (`0 0% 100%`).
- `--border` neutral hellgrau (z. B. `220 14% 92%`) statt bläulich.
- `--muted` sehr helles Neutralgrau, `--muted-foreground` unverändert.
- `--shadow-card` / `--shadow-card-hover` neutral (schwarz mit sehr geringer Opazität) statt blauer Tint.
- `--gradient-surface` entfernen bzw. auf schlichtes Weiß setzen — kein Verlauf mehr im Main-Bereich.
- Sidebar-Tokens umdrehen:
  - `--sidebar-background: 221 100% 50%` (Primary-Blau).
  - `--sidebar-foreground: 0 0% 100%` (weiß).
  - `--sidebar-primary: 0 0% 100%` (weiße Akzentfläche für aktive Items).
  - `--sidebar-primary-foreground: 221 100% 50%` (blauer Text auf weißem aktiven Item).
  - `--sidebar-accent: 221 100% 45%` (leicht dunkleres Blau für Hover).
  - `--sidebar-accent-foreground: 0 0% 100%`.
  - `--sidebar-border: 221 80% 45%`.
- `.card-accent`-Utility entfernen bzw. neutralisieren — keine blaue Border-Left mehr.

### 2. Sidebar (`src/pages/AdminPanel.tsx`)
- Logo-Kachel: weißes Quadrat mit blauem „K“ statt Gradient.
- Gruppen-Labels in `text-white/60`.
- Nav-Items: Text/Icons weiß, Hover `bg-white/10`, aktiv `bg-white text-primary` mit sanftem Schatten.
- Footer-Bereich (Avatar, Email, Logout): weiße Schrift, Divider `border-white/15`, Logout-Icon-Button Hover `bg-white/10`.

### 3. Header (`AdminPanel.tsx`)
- Zurück auf `bg-white` mit dezenter neutraler Border (`border-border`), ohne blaue Tönung und ohne Backdrop-Blur-Effekt.
- Titeltext `text-foreground`, Trigger-Button neutral.

### 4. Cards & Dialoge
- `src/components/ui/card.tsx`: `bg-card` (=weiß), neutrale Border, dezente neutrale Shadow. Keine `card-accent`-Utility mehr.
- `src/components/ui/dialog.tsx`, `popover.tsx`, `dropdown-menu.tsx`, `select.tsx`: Backdrop-Blur/Transparenz entfernen, auf `bg-popover` (=weiß) mit neutraler Border stellen.
- `src/components/admin/DialogShell.tsx`: Icon-Badge auf schlichtes `bg-primary/10 text-primary` ohne Ring/Gradient; Footer-Divider neutral.

### 5. Inputs (`src/components/ui/input.tsx`, `textarea.tsx`, `select.tsx`)
- Hintergrund `bg-white`, Border `border-input` (neutral), Fokus weiterhin Primary-Ring — aber ohne blauen Grundton im Ruhezustand.

### 6. Buttons (`src/components/ui/button.tsx`)
- `default` bleibt solides `bg-primary` mit weißer Schrift (bereits so).
- `outline`/`secondary`/`ghost`: neutrale Hintergründe (weiß bzw. `bg-muted`), Hover in dezentem Neutral- statt Blauton, damit sie auf weißer Fläche ruhig wirken.

## Nicht angefasst
- `/auth`, `/dashboard`, Business-Logik, Routen, Datenmodell.

## Technische Details
Betroffene Dateien: `src/index.css`, `tailwind.config.ts` (nur falls nötig — Tokens sind bereits registriert), `src/pages/AdminPanel.tsx`, `src/components/ui/{card,dialog,popover,dropdown-menu,select,input,textarea,button}.tsx`, `src/components/admin/DialogShell.tsx`. Kein DB-, Function- oder Logik-Change.

## Verifikation
Playwright-Screenshots von `/admin`, `/admin/verifikationen`, `/admin/leads` und einem geöffneten Dialog — Sidebar sattblau mit weißen Akzenten, restliche Fläche weiß wie `/auth`.
