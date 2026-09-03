# Postident: nur den Code extrahieren (Data Matrix), kein Seiten-Fallback

## Erkenntnis aus den hochgeladenen PDFs

Der Code oben rechts auf dem Postident-Coupon ist **kein QR-Code, sondern ein Data Matrix Code** (Deutsche-Post-Standard). Deshalb findet `jsQR` nichts und der aktuelle Code fällt auf die Vollseiten-Vorschau zurück. Für die Filiale ist genau dieser Data-Matrix-Code entscheidend — er muss sauber extrahiert und angezeigt werden.

## Änderungen

**`src/lib/extractQrFromPdf.ts` → umbenennen zu `src/lib/extractPostidentCode.ts`**
- `jsQR` entfernen; stattdessen `zxing-wasm` (`readBarcodesFromImageData`) verwenden — unterstützt sowohl Data Matrix als auch QR.
- Erste PDF-Seite mit pdf.js bei Scale 2.5 rendern, ImageData an ZXing geben, nach Formaten `["DataMatrix","QRCode"]` suchen.
- Wenn nichts erkannt wird: mit Scale 3.5 erneut versuchen.
- Bei Treffer: mit den zurückgegebenen Corner-Points croppen (12% Padding, wie bisher) und als PNG-Data-URL zurückgeben.
- Kein Vollseiten-Fallback mehr. Bei endgültigem Fehlschlag: `Error("Code konnte nicht aus der PDF extrahiert werden")`.
- Rückgabetyp: `Promise<string>` (nur die Data-URL des Codes).

**`src/pages/Dashboard.tsx`**
- Import auf neuen Modulnamen/Signatur umstellen.
- Label in der Card von "Postident QR-Code" auf "Postident-Code" ändern.
- Fehlerzustand: klare Meldung "Code konnte nicht aus der PDF extrahiert werden" + PDF-Download-Button; keine Seitenvorschau als Ersatz.
- Lightbox öffnet nur, wenn eine Code-Data-URL vorhanden ist.

## Technische Details

- Neue Dependency: `zxing-wasm` (WASM wird von Vite gebündelt, keine Serverkomponente nötig).
- pdf.js-Rendering, Cropping-Logik mit Padding und die Postident-Datenladung aus `user_documents` + signierte URL bleiben unverändert.
- Keine DB-/Storage-/Edge-Function-Änderungen.
