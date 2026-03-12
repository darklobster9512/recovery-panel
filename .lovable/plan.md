

# Seitentitel, Beschreibung, Favicon & Registrierung entfernen

## 1. `index.html` — Titel & Meta-Tags aktualisieren
- **Title**: "RecoveryPanel — Krypto-Rückgewinnung"
- **Description**: "Rechtssichere Rückgewinnung von Krypto-Assets in Zusammenarbeit mit Strafverfolgungsbehörden."
- **og:title / og:description**: entsprechend anpassen
- **Author**: "RecoveryPanel"

## 2. Favicon generieren
- Ein SVG-Favicon erstellen: blaues Schild-Icon (passend zum Shield-Logo im Auth-Screen) als `public/favicon.svg`
- In `index.html` referenzieren: `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`

## 3. `src/pages/Auth.tsx` — Registrierung entfernen
- `isLogin`-State und Toggle-Logik entfernen (immer Login)
- Sign-Up-Branch im `handleSubmit` entfernen
- `success`-State entfernen
- Heading/Text statisch auf "Willkommen zurück" / "Melde dich an..."
- "Noch kein Konto? Registrieren"-Link am Ende entfernen
- Button-Text statisch "Anmelden"

### Dateien
- `index.html`
- `public/favicon.svg` (neu)
- `src/pages/Auth.tsx`

