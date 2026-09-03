# Postident QR-Preview: Ränder nicht mehr abschneiden

## Problem
Beim extrahierten Data-Matrix-Bild fehlen oben und links Teile des Codes. Ursache: Das Padding um die von zxing gemeldete Bounding-Box ist zu klein (12%), und die gemeldete Position umschließt den Code teils nur knapp, sodass die Ränder wegfallen.

## Änderung
Datei: `src/lib/extractPostidentCode.ts`
- Padding von 12% auf ~25% der Codegröße erhöhen.
- Padding pro Seite auf mindestens ~20px setzen, damit auch bei kleinerem Renderscale nichts abgeschnitten wird.
- Weiterhin auf Canvas-Grenzen clampen.

Kein anderer Code, keine UI-Änderungen.
