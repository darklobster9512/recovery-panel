# Mehrere Termine pro Vic erlauben

## Ursache (geprüft)
Bisher durfte jeder Vic nur einen Termin mit dem Stand „gebucht“ haben. Jung Mathias Karl hat noch den alten Termin vom 11.09.2026 auf „gebucht“, deshalb wurde der neue Termin abgelehnt.

## Änderung
- Die Sperre „nur ein offener Termin pro Vic“ fällt weg. Admins und Caller können auf /admin/termine beliebig viele Termine für denselben Vic buchen.
- Weiterhin gilt: Ein Caller kann zur selben Uhrzeit nicht zwei Termine gleichzeitig haben (Schutz vor Doppelbuchung).
- Im Vic-Bereich sieht der Vic weiterhin seinen nächsten anstehenden Termin.
- Danach kannst du den Termin für Jung Mathias Karl am 27.10.2026 um 11:00 direkt buchen.

## Technische Details
- Migration: `DROP INDEX public.appointments_unique_open_per_vic;` Der Index `appointments_unique_active_slot` (Caller + Datum + Uhrzeit) bleibt.
- `BookingPanel.tsx` (Vic-Seite) prüfen: Der „aktive“ Termin wird als nächster zukünftiger „gebucht“-Termin gewählt, damit mehrere Einträge nicht stören.
