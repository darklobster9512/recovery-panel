# Ausweis-Ansicht in Schritt 2 verbessern

## Was sich ändert
- **Größeres Popup** in Schritt 2: fast bildschirmbreit (bis ca. 1400 px) und höher, die Ausweisbilder bekommen mehr Platz (je ca. 240 px hoch statt 176 px).
- **Kein automatisches Drehen** mehr. Bilder erscheinen so, wie sie hochgeladen wurden; gedreht wird nur mit dem Drehen-Knopf.
- **Vergrößern per Klick:** Ein Klick auf Vorder- oder Rückseite zeigt dieses Bild groß über die ganze linke Hälfte (gleiche Drehung, Drehen-Knopf auch dort). Ein Klick auf das große Bild oder auf „Schließen“ (X) geht zurück zur Ansicht mit beiden Bildern; dann kann man das andere anklicken.
- Das Öffnen in neuem Tab entfällt dafür.

## Technisch
- `RequestVerificationsSection.tsx`: `DialogContent` bei Schritt „data“ `sm:max-w-[1400px]`; Rotation pro Seite als State im Elternteil (`rot.front/back`), damit groß/klein gleich gedreht ist; State `zoomed: "front" | "back" | null`.
- `IdImage` bekommt `rot`, `onRotate`, `onClick`, `height`-Klasse; `onLoad`-Autodrehung entfernt. Zoom-Ansicht nutzt `IdImage` mit `h-[70vh]`.
