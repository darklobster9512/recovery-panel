# Postident: nur QR-Code, kein Fallback auf ganze Seite

Aktuell fällt die Extraktion, wenn jsQR den QR-Code nicht direkt erkennt, auf ein Rendering der gesamten PDF-Seite zurück. Das soll entfernt werden — es wird ausschließlich der QR-Code angezeigt.

## Änderungen

**`src/lib/extractQrFromPdf.ts`**
- Fallback entfernen: kein `canvas.toDataURL()` der Vollseite mehr.
- Wenn jsQR beim ersten Rendern nichts findet, weitere Erkennungsversuche starten, bevor aufgegeben wird:
  1. Seite bei höherer Scale rendern (3.5, dann 4.5).
  2. Vor jsQR Graustufen-/Kontrastnormalisierung anwenden.
  3. Optional: Seite in 4 Quadranten teilen und jsQR pro Quadrant laufen lassen (QR ist oft klein und in einer Ecke).
- Wenn nach allen Versuchen kein QR gefunden: Fehler werfen (`"QR-Code konnte nicht erkannt werden"`).
- Rückgabetyp vereinfachen: `Promise<string>` (nur die QR-Data-URL), `foundQr` entfällt.

**`src/pages/Dashboard.tsx`**
- Aufrufstelle an neuen Rückgabetyp anpassen.
- Fehlerzustand in der Postident-Card zeigt eine klare Meldung ("QR-Code konnte nicht aus der PDF extrahiert werden") plus PDF-Download-Button; kein Seiten-Preview mehr als Ersatz.
- Lightbox öffnet nur, wenn tatsächlich ein QR-Bild vorhanden ist.

## Technische Details

- pdfjs/jsQR-Pipeline bleibt bestehen, nur ohne Vollseiten-Fallback.
- Cropping-Logik (Bounding-Box + 12% Padding) unverändert.
- Keine DB-/Storage-/Edge-Function-Änderungen.
