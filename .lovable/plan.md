

# Fix: Einheitlicher heller Style + Landing Page entfernen

## Problem
Die CSS-Variablen in `:root` (index.css) sind auf das dunkle Neon-Theme der Landingpage gesetzt (navy background, cyan primary, etc.). Da die UI-Komponenten (Button, Dialog, Popover, Card etc.) alle `hsl(var(--primary))`, `hsl(var(--background))` usw. verwenden, erscheinen sie im Dark/Neon-Look. Auth und Dashboard umgehen das zwar mit hardcoded `bg-white`-Klassen, aber Dialoge, Buttons und Popovers greifen auf die dunklen CSS-Variablen zurück.

## Änderungen

### 1. `src/index.css` — CSS-Variablen auf helles Theme umstellen + Landing-Page-Keyframes entfernen

Alle `:root`-Variablen auf das helle Farbschema umstellen (weiß, grau, Blau `hsl(221,100%,50%)` als Primary). Alle Landing-Page-Keyframes entfernen (glitch, scan-line, float-particle, orb-move, pulse-glow, text-glow-pulse, typing-cursor, feature-float). Die auth-float Keyframes bleiben, da sie auf der Auth-Seite genutzt werden. Die Neon-Variablen (`--neon-cyan`, `--neon-green`, `--glow-cyan`) werden entfernt.

Neue Variablen:
```
--background: 0 0% 100%;        /* weiß */
--foreground: 224 10% 10%;      /* fast schwarz */
--card: 0 0% 100%;              /* weiß */
--card-foreground: 224 10% 10%;
--popover: 0 0% 100%;
--popover-foreground: 224 10% 10%;
--primary: 221 100% 50%;        /* Blau */
--primary-foreground: 0 0% 100%;
--secondary: 220 14% 96%;       /* hellgrau */
--secondary-foreground: 224 10% 10%;
--muted: 220 14% 96%;
--muted-foreground: 220 9% 46%;
--accent: 220 14% 96%;
--accent-foreground: 224 10% 10%;
--destructive: 0 84% 60%;
--destructive-foreground: 0 0% 100%;
--border: 220 13% 91%;
--input: 220 13% 91%;
--ring: 221 100% 50%;
```

### 2. `tailwind.config.ts` — Neon-Farben entfernen

Die `neon-cyan` und `neon-green` Einträge aus `colors` entfernen.

### 3. `src/pages/Index.tsx` + `src/App.css` — Landingpage löschen

Die Datei `src/pages/Index.tsx` komplett durch eine Redirect-Seite ersetzen, die einfach auf `/auth` weiterleitet. `src/App.css` aufräumen (wird eh nicht mehr gebraucht).

### 4. `src/App.tsx` — Route `/` auf Auth redirecten

Die Index-Route auf eine Weiterleitung zu `/auth` ändern (oder Index.tsx als Redirect implementieren).

### 5. Auth.tsx, Dashboard.tsx, AdminPanel.tsx — Hardcoded Overrides bereinigen

Da die CSS-Variablen jetzt hell sind, können die meisten `bg-white text-gray-900`-Overrides bleiben (schaden nicht), aber die Komponenten-Buttons die `bg-[hsl(221,100%,50%)]` verwenden, funktionieren jetzt auch korrekt über `bg-primary`.

## Ergebnis
- Einheitlich helles Theme überall (Auth, Dashboard, Admin, Dialoge, Popovers)
- Primary-Farbe = Blau (#0061FF) konsistent
- Keine Neon-/Dark-Artefakte mehr
- Landing Page komplett entfernt

