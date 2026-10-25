# Vergrößerte Ausweis-Ansicht ohne Höhensprung

## Was sich ändert
- Das vergrößerte Bild nimmt genau den Platz ein, den sonst Vorder- und Rückseite zusammen belegen. Die Popup-Höhe bleibt beim Vergrößern und Zurückschalten gleich.

## Technisch
- `RequestVerificationsSection.tsx`: Zoom-Ansicht nutzt statt `h-[70vh]` eine feste Höhe, die zwei kleinen Karten entspricht (2 × Bild `h-60` + Kopfzeile + Abstand `space-y-3` − eigene Kopfzeile), also `h-[523px]`; Kopfzeilen beider Ansichten auf identische Höhe (`h-8`) festlegen, damit die Rechnung exakt passt.
