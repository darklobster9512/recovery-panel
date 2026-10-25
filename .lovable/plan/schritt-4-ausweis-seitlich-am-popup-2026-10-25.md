# Schritt 4: Ausweis seitlich am Popup

## Was sich ändert
- In Schritt 4 „Überprüfung“ hängt rechts direkt am Popup ein eigenes, schmales Fenster (ca. 380 px breit, gleiche Höhe wie das Popup, kleiner Abstand, gleicher Rahmen und Schatten). Es zeigt den Personalausweis: Vorderseite oben, Rückseite unten.
- Jedes Bild hat den Drehen-Knopf wie in Schritt 2. Die Drehung aus Schritt 2 wird übernommen und gilt in beide Richtungen.
- Klick auf ein Bild vergrößert es im Seitenfenster (gleiche Höhe, Klick oder X schließt), wie in Schritt 2. PDFs erscheinen als Link „PDF öffnen“.
- Auf kleinen Bildschirmen (unter ca. 1200 px Breite) passt das Fenster nicht daneben. Dort erscheint es stattdessen unter der Übersicht im Popup.

## Technisch
- `RequestVerificationsSection.tsx`: Bei `step === "review"` bekommt `DialogContent` `overflow-visible`, der bisherige Inhalt kommt in einen inneren Container mit `max-h`/`overflow-y-auto`. Das Seitenfenster liegt als `absolute left-full top-0 ml-3 h-full w-[380px]` innerhalb von `DialogContent`. So bleibt es Teil des Dialogs: Klicks schließen das Popup nicht, und Scrollen funktioniert.
- Die Bildanzeige aus Schritt 2 (Karten, `IdImage`, `zoomed`, `rot`) wird in eine kleine interne Komponente `IdImagesPanel` ausgelagert und in beiden Schritten verwendet.
