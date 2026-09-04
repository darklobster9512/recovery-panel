# Termin buchen – 50/50 One-Card Layout

## Ziel
Das Dashboard-Reiter „Termin buchen“ (`/dashboard` → `BookingPanel`) soll wie im Referenzprojekt (`vic-automation` → `Bewerbungsgespraech`) als **eine einzige Card mit 50/50-Innenlayout** dargestellt werden. Aktuell sind Kalender und Zeitslots in zwei getrennten Cards/Boxen.

## Umsetzung

### 1. `src/components/BookingPanel.tsx` umbauen
- Eine äußere Card/Container als Rahmen.
- Header: Titel, Untertitel mit Ansprechpartner-Name.
- Body: `grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x`.
  - **Linke Hälfte:** `Calendar` aus `src/components/ui/calendar.tsx` zur Datumsauswahl.
  - **Rechte Hälfte:** Zeitslots als Button-Grid (z. B. 2 Spalten, scrollbar).
- Bestätigungs-Button erscheint unten in der Card, sobald Datum + Uhrzeit gewählt sind.
- Bereits gebuchter Termin weiterhin oberhalb der Card als Erfolgsbanner/Infoleiste anzeigen, mit „Absagen“- bzw. „Umbuchen“-Option.

### 2. Design-Anpassungen an Korte & Partner
- Akzentfarbe: Navy `#0b1f3a` statt Referenz-Brand-Color.
- Sekundärfarbe/Highlight: Gold `#c9a24a`.
- Weißer Card-Hintergrund, subtile Schatten, abgerundete Ecken (`rounded-xl`).
- Ausgewählter Tag und aktiver Slot erhalten Navy-Hintergrund + weiße Schrift.
- Gebuchte/vergangene Zeiten deutlich als disabled grau darstellen.

### 3. Funktionalität beibehalten
- Lädt `BookingSettings` aus `app_settings`.
- Zeigt nur buchbare Wochentage laut `booking_weekdays`.
- Filtert Zeiten nach `booking_lead_hours` und bereits belegten Slots (`booked_slots_for_caller`).
- Buchung ersetzt einen bestehenden aktiven Termin (nur ein aktiver Termin pro Vic).
- Absage setzt Status auf `abgesagt`.
- Telegram-Notification `appointment_booked` bleibt erhalten.

### 4. Mobile Darstellung
- Unterhalb `md` stapelt sich die Card vertikal: Kalender oben, Zeitslots unten.
- Volle Breite im Content-Bereich des Dashboards.
- Sidebar weiterhin separat (keine Änderung an `Dashboard.tsx` außer ggf. Wrapper-Anpassungen).

### 5. Keine neuen Abhängigkeiten
- `Calendar` und `date-fns` sind bereits vorhanden.
- Framer Motion ist nicht installiert; Animationen werden mit Tailwind-Transitionen/Animate-Utility realisiert.

## Nicht im Scope
- Keine Änderung an der Datenbank oder den RPCs (`booked_slots_for_caller`, `appointments`).
- Keine Änderung am Admin-Termin-Reiter (`AdminAppointments.tsx`).
- Keine neuen Features wie E-Mail/SMS-Benachrichtigungen beim Buchen (bestehende Telegram-Notification bleibt).
