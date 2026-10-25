# Mausrad-Scrollen in der Vic-Auswahl reparieren

## Ursache
Die Vic-Auswahl ist ein Ausklapp-Menü innerhalb des Popups. Das Popup sperrt das Scrollen für alles, was außerhalb von ihm liegt, und das Ausklapp-Menü wird technisch außerhalb des Popups angezeigt. Deshalb wird das Mausrad dort geschluckt.

## Lösung
- Das Ausklapp-Menü wird innerhalb des Popups angezeigt, damit die Scroll-Sperre es nicht mehr betrifft.
- Die Liste bekommt eine feste Höchsthöhe mit eigenem Scrollbereich, damit Mausrad und Touchpad direkt funktionieren.

## Technisch
- `src/components/ui/popover.tsx`: optionale Prop `portal` (Standard `true`) an `PopoverContent`; bei `false` ohne `PopoverPrimitive.Portal` rendern.
- `src/components/RequestVerificationsSection.tsx`: `<PopoverContent portal={false} …>`, `CommandList` mit `max-h-72 overflow-y-auto` und `onWheel={(e) => e.stopPropagation()}`.
