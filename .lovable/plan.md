# Alle Bilder nach `public/` verschieben

Aktuell liegen Bilder gemischt in `src/assets/` (teils als Datei, teils als CDN-`.asset.json`-Pointer) und `public/`. Ziel: alle Bilder unter `public/` als echte Dateien, referenziert über absolute Pfade (`/dateiname`).

## Zu verschiebende Dateien

Aus `src/assets/`:
- `anosim-logo.svg`
- `app-store.svg`
- `europol-logo.png`
- `google-play.svg`
- `iosco-logo.png` (aktuell CDN-Pointer `iosco-logo.png.asset.json` → Datei von CDN-URL herunterladen und in `public/` speichern)
- `postident-logo.jpg` (CDN-Pointer → runterladen)
- `thomas-korte.png` (CDN-Pointer → runterladen)

Ziel: `public/anosim-logo.svg`, `public/app-store.svg`, `public/europol-logo.png`, `public/google-play.svg`, `public/iosco-logo.png`, `public/postident-logo.jpg`, `public/thomas-korte.png`.

## Code-Anpassungen

Betroffene Dateien (bereits via rg gefunden):
- `src/pages/Auth.tsx`
- `src/pages/Dashboard.tsx`
- `src/components/AdminPhoneNumbers.tsx`
- `src/components/RecoveryGuide.tsx`

In jeder Datei die `import xyz from "@/assets/..."`- bzw. `.asset.json`-Imports entfernen und durch String-Pfade ersetzen, z. B.:

```tsx
// vorher
import europol from "@/assets/europol-logo.png";
<img src={europol} />

// nachher
<img src="/europol-logo.png" />
```

## Aufräumen

Nach der Umstellung `src/assets/` löschen (inklusive der drei `.asset.json`-Pointer). CDN-Assets werden nicht per `lovable-assets delete` entfernt, um alte Deploys nicht zu brechen.

## Nicht enthalten

- Keine Änderung an `favicon.*`, `placeholder.svg`, `wasm/`.
- Keine visuellen/funktionalen Änderungen — nur Pfade.
