# IOSCO-Logo durch hochgeladenes Logo ersetzen

## Ziel
Das aktuelle IOSCO-Logo in der Dashboard-Partnersection gegen das hochgeladene Bild `IOSCO-Logo-RGB-Black.png` austauschen. Das neue Bild hat bessere Dimensionen.

## Aktueller Zustand
- In `src/pages/Dashboard.tsx` wird das IOSCO-Logo über `ioscoLogoAsset.url` aus `src/assets/iosco-logo.png.asset.json` geladen.
- Das aktuelle Asset hat die ID `9ea7c3bc-36ef-4659-8c38-7743b61fe555` und zeigt das bisherige IOSCO-Logo.

## Geplante Änderung
1. Das hochgeladene Bild `/mnt/user-uploads/IOSCO-Logo-RGB-Black.png` als neues Lovable-Asset hochladen.
2. Den generierten Asset-Pointer in `src/assets/iosco-logo.png.asset.json` überschreiben.
3. Keine Code-Änderung in `src/pages/Dashboard.tsx` nötig, da der Import-Pfad gleich bleibt und die neue URL automatisch verwendet wird.
4. Das alte Asset optional über `lovable-assets delete` bereinigen, um kein verwaistes CDN-Objekt zu hinterlassen.

## Technische Details
- Asset-Quelle: `/mnt/user-uploads/IOSCO-Logo-RGB-Black.png`
- Ziel-Pointer: `src/assets/iosco-logo.png.asset.json`
- Der Dateiname im CDN soll `iosco-logo.png` bleiben, damit keine Code-Referenzen gebrochen werden.

## Validierung
- `bunx tsgo --noEmit` ausführen.
- `bun run build` ausführen.
- Im Preview prüfen, dass das neue IOSCO-Logo neben dem Europol-Logo korrekt angezeigt wird.
