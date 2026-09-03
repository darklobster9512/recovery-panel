# IOSCO Logo zur Dashboard-Partner-Section hinzufügen

## Ziel
Auf `/dashboard` im Bereich „In Kooperation mit“ neben dem Europol-Logo auch das hochgeladene IOSCO-Logo anzeigen.

## Aktueller Zustand
In `src/pages/Dashboard.tsx` (Zeilen 648–663) wird nur das Europol-Logo als einzelnes Bild in der Partner-Section dargestellt.

## Geplante Änderung
1. Das hochgeladene Bild `user-uploads://IOSCO_LOGO_2024.png` über `lovable-assets` als CDN-Asset hochladen und als `src/assets/iosco-logo.png.asset.json` speichern.
2. Den Asset-Pointer in `src/pages/Dashboard.tsx` importieren.
3. Die Partner-Section erweitern, sodass Europol- und IOSCO-Logo nebeneinander, horizontal zentriert und optisch abgestimmt angezeigt werden.
4. Beide Logos erhalten sinnvolle Alt-Texte (`Europol`, `IOSCO`).

## Technische Details
- Datei: `src/pages/Dashboard.tsx`
- Neues Asset: `src/assets/iosco-logo.png.asset.json`
- Keine Schema-, API- oder Edge-Function-Änderungen erforderlich.

## Validierung
- `bunx tsgo --noEmit` ausführen.
- `bun run build` ausführen.
- Visuell im Preview prüfen, dass beide Logos nebeneinander unter „In Kooperation mit“ angezeigt werden.
