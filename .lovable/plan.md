# Store-Buttons bei mobilen Aufträgen nebeneinander

## Ziel
In der mobilen Auftragsdetailansicht von `/dashboard` sollen App Store und Google Play nebeneinander statt untereinander stehen.

## Umsetzung
- Den Store-Badge-Container in `src/pages/Dashboard.tsx` mobil als zweispaltiges Layout darstellen.
- Beide vorhandenen Buttons erhalten gleich viel Breite und bleiben innerhalb der verfügbaren Contentbreite.
- Ab `sm` bleibt die bestehende Desktop-Darstellung unverändert.
- Falls nur ein Store-Link vorhanden ist, wird nur der vorhandene Button sauber dargestellt.

## Prüfung
- TypeScript-Prüfung und Produktions-Build ausführen.
- Mobile Darstellung bei 393 px Breite auf Überlauf und korrekte Ausrichtung kontrollieren.