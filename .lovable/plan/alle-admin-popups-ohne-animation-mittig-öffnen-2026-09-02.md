# Alle Admin-Popups ohne Animation mittig öffnen

## Ziel
Sämtliche modalen Popups im Admin-Panel erscheinen sofort an ihrer endgültigen Position in der Bildschirmmitte. Kein Schwenken, Sliden, Zoomen oder Ein-/Ausblenden.

## Umsetzung
1. In der globalen `DialogContent`-Komponente alle Open-/Close-Animationen und Animationsdauern vom Dialoginhalt entfernen; die feste Zentrierung über `left: 50%`, `top: 50%` und Translation bleibt erhalten.
2. Auch beim zugehörigen Dialog-Overlay sämtliche Ein-/Ausblendanimationen entfernen, damit das komplette Popup ohne Übergang erscheint und verschwindet.
3. Dasselbe zentral für `AlertDialogContent` und dessen Overlay umsetzen, einschließlich der aktuell vorhandenen Slide-, Zoom- und Fade-Klassen.
4. Alle Admin-Verwendungen von `DialogContent` und `AlertDialogContent` kontrollieren, damit keine lokale Klasse die Animation erneut aktiviert.
5. Mehrere Admin-Popups im Browser öffnen und prüfen, dass sie auf Desktop direkt mittig und ohne Bewegung erscheinen; anschließend Tests und Typprüfung ausführen.

## Unverändert
Dropdowns, Such-Popover, Tooltips, Toasts und die mobile Navigation werden nicht verändert, da sie keine mittig zentrierten Admin-Modalfenster sind.
