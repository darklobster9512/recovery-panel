# Caller können eigene Termine anlegen

Caller sollen in ihrem Terminkalender (`/admin/termine`) selbst Termine eintragen können: Vic auswählen (nur eigene zugewiesene), Datum und Uhrzeit wählen, Grund angeben.

## Was neu ist

- Button **„Termin hinzufügen"** oben in der Termine-Ansicht (für Caller und Admin).
- Dialog mit:
  - Vic-Auswahl mit Suche — für Caller nur die ihm zugewiesenen Vics, für Admin alle Vics.
  - Datum (Kalender) und Uhrzeit (Zeitraster aus den Einstellungen: Von/Bis, Takt, Wochentage).
  - Freitextfeld **Grund für Termin** (Pflichtfeld).
  - Belegte Zeiten des jeweiligen Callers werden ausgegraut, damit ein Zeitfenster pro Caller nur einmal belegt wird.
- Neue Spalte **Grund** in der Terminliste; bei Vic-Buchungen bleibt sie leer.
- Selbst angelegte Termine erscheinen sofort in der Liste und – wie bisher – als Telegram-Meldung „Termin gebucht".

Vic-gebuchte Termine und die bestehende Übertragung bei Caller-Zuweisung bleiben unverändert.

## Technische Umsetzung

Datenbank (eine Migration):
- `appointments.reason text` (nullable) ergänzen.
- Neue RLS-Policy: Caller dürfen Termine anlegen (`INSERT`), wenn der Vic ihnen zugewiesen ist und `caller_id = auth.uid()`. Admin-Policy deckt Admins bereits ab.

Frontend:
- `src/components/AdminAppointments.tsx`: Button + neuer Dialog, Laden der Vic-Liste (gefiltert nach `assigned_caller_id` bei Rolle `caller`), Laden der Buchungseinstellungen aus `app_settings`, Slot-Berechnung über die vorhandenen Helfer in `src/lib/booking.ts` (`generateTimeSlots`, `isBookableDay`, `toDateKey`), belegte Slots über `booked_slots_for_caller`, Insert mit `status = 'gebucht'`, `caller_id` = eingeloggter Caller (bei Admin: der zugewiesene Caller des Vics oder leer), `created_by = auth.uid()`.
- Spalte „Grund" in Tabelle und Select in der Datenabfrage ergänzen.
- Telegram-Event `appointment_booked` wie bei der Vic-Buchung auslösen.
