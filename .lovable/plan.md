# Postident QR-Preview: enger zuschneiden

## Problem
Aktuell ist um den Data-Matrix-Code zu viel Rand sichtbar, sodass oben und links noch anderer Text/Inhalt der PDF mit im Bild landet. Der Code soll enger zugeschnitten werden, nur der Code selbst.

## Änderung
Datei: `src/lib/extractPostidentCode.ts`
- Padding um die von zxing gemeldete Bounding-Box von 12% auf ca. 3% reduzieren, sodass wirklich nur der Code (mit minimalem Rand) zu sehen ist.
- Weiterhin auf Canvas-Grenzen clampen.

Keine weiteren Änderungen.
