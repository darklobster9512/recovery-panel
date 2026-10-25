# Vic-Auswahl ohne Ausklapp-Menü

Das Ausklapp-Menü im Popup macht die Probleme (erst kein Scrollen, jetzt verschobene/abgeschnittene Darstellung). Statt es weiter zu flicken, fällt es ganz weg.

## Neu im Schritt „Für welchen Vic?“
- Direkt im Popup: Reiter „Verfügbar“ / „Kein Ausweis“, darunter das Suchfeld (Cursor steht schon drin) und darunter die Liste.
- Die Liste hat eine feste Höhe und scrollt normal mit dem Mausrad.
- Weiterhin 20 Einträge, „Weitere anzeigen“, Suche über alle Vics.
- Der gewählte Vic ist blau markiert; „Weiter“ wie bisher.

## Technisch
- `RequestVerificationsSection.tsx`: `Popover`/`PopoverTrigger`/`PopoverContent` entfernen, `Command` inline mit Rahmen rendern, `CommandList` `max-h-80 overflow-y-auto`.
- `src/components/ui/popover.tsx`: `portal`-Prop wieder entfernen (Ursprungszustand).
