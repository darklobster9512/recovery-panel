# Typografie auf Inter umstellen (wie vic-automation)

Die aktuelle Manrope/Sora-Kombination im Admin-Panel wird durch **Inter** ersetzt — identisch zum Referenzprojekt `vic-automation`, das ausschließlich Inter (Weights 300–800) verwendet.

## Änderungen

- `index.html`: Google-Fonts-`<link>` für `Inter:wght@300;400;500;600;700;800` einbinden (analog Referenz per `@import`, aber sauberer via `<link preconnect>` im Head).
- `src/main.tsx`: bestehende `@fontsource/manrope` und `@fontsource/sora` Imports entfernen.
- `tailwind.config.ts`: sowohl `sans` als auch `display` auf `['Inter', ...system]` setzen, damit `font-sans` und `font-display` beide Inter rendern.
- `src/index.css`: `body`- und Heading-Regeln auf Inter aktualisieren; `-webkit-font-smoothing: antialiased` beibehalten.
- Optional: `package.json` — `@fontsource/manrope` und `@fontsource/sora` als ungenutzte Dependencies entfernen.

## Nicht geändert

Layout, Farben, Abstände, Komponenten, Business-Logik — nur die Schriftart wechselt.
