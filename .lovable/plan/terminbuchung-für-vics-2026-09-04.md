# Terminbuchung für Vics

Vics können im Portal selbst ein Telefonat mit ihrem Ansprechpartner buchen. Ist noch kein Caller zugewiesen, läuft der Termin beim Admin (Dr. Thomas Korte) — genau wie schon im Livechat. Wird der Vic später einem Caller zugewiesen, wandert sein Termin automatisch mit.

## Was der Vic sieht

- Neuer Reiter „Termin" in der Dashboard-Sidebar.
- Kalender: nur freigegebene Wochentage, keine Vergangenheit.
- Nach Datumswahl eine Liste der Zeitfenster (Standard 30-Minuten-Takt). Belegte Fenster des eigenen Ansprechpartners sind ausgegraut.
- Nach dem Buchen: Bestätigungskarte mit Datum, Uhrzeit und Ansprechpartner (Name, Foto, Telefon), plus Buttons „Absagen" und „Termin verlegen".

## Was Admin und Caller sehen

- Neuer Reiter „Termine" im Admin-Panel (Gruppe Vertrieb).
- Tabelle mit Datum, Uhrzeit, Vic (Name, E-Mail, Telefon), Ansprechpartner, Status.
- Filter: Zeitraum (kommende / vergangene / alle) und Ansprechpartner.
- Admin sieht alle Termine, ein Caller nur die Termine seiner zugewiesenen Vics.
- Admin/Caller können einen Termin absagen und den Status auf „stattgefunden" oder „nicht erreicht" setzen.

## Einstellungen

Neue Karte „Terminbuchung" unter Einstellungen:

- Buchbar von / bis (Uhrzeit, Standard 09:00–17:00)
- Takt in Minuten (Standard 30)
- Wochentage (Checkboxen Mo–So, Standard Mo–Fr)
- Vorlaufzeit in Stunden (Standard 2) — verhindert Buchungen „in fünf Minuten"

## Regeln

- Pro Ansprechpartner darf ein Zeitfenster nur einmal belegt sein (Telefonat). Das wird in der Datenbank erzwungen, nicht nur in der Oberfläche.
- Ein Vic hat höchstens einen offenen Termin. Verlegen = alter Termin wird abgesagt, neuer gebucht.
- Beim Zuweisen eines Callers wird der Ansprechpartner offener Termine mit umgezogen. Kollidiert der Termin dann mit einem bestehenden Termin des Callers, bleibt er trotzdem bestehen (Doppelbelegung ist hier ausdrücklich erlaubt und wird in der Liste markiert).

## Technische Umsetzung

**Migration**

- Tabelle `public.appointments`: `id`, `vic_id` (→ `profiles.id`), `caller_id` (uuid, `NULL` = Admin-Termin), `appointment_date` (date), `appointment_time` (time), `status` text (`gebucht`, `stattgefunden`, `nicht_erreicht`, `abgesagt`), `created_by`, `created_at`, `updated_at` + Touch-Trigger.
- `CREATE UNIQUE INDEX` auf (`coalesce(caller_id, '00000000-…')`, `appointment_date`, `appointment_time`) `WHERE status = 'gebucht'` → nur ein aktiver Termin je Ansprechpartner und Zeitfenster; abgesagte Termine blockieren nicht.
- Partieller Unique-Index auf `vic_id WHERE status = 'gebucht'` → max. ein offener Termin je Vic.
- GRANTs: `SELECT, INSERT, UPDATE` für `authenticated`, `ALL` für `service_role` (kein `anon`).
- RLS: Vic liest/schreibt/aktualisiert nur Zeilen mit `vic_id = auth.uid()`; Caller liest/aktualisiert Zeilen, deren Vic ihm zugewiesen ist (`profiles.assigned_caller_id = auth.uid()`) — analog zu den bestehenden Livechat-Policies; Admin per `has_role(auth.uid(), 'admin')` vollen Zugriff.
- Damit Vics freie/belegte Fenster ihres Ansprechpartners sehen können, ohne fremde Termindaten zu lesen: `SECURITY DEFINER`-Funktion `booked_slots_for_caller(_caller_id uuid, _from date, _to date)`, die nur Datum + Uhrzeit zurückgibt (`search_path = public`).
- `app_settings` erhält `booking_start_time time DEFAULT '09:00'`, `booking_end_time time DEFAULT '17:00'`, `booking_interval_minutes int DEFAULT 30`, `booking_weekdays int[] DEFAULT '{1,2,3,4,5}'`, `booking_lead_hours int DEFAULT 2`.
- Spalte `is_transferred boolean NOT NULL DEFAULT false`. Der Unique-Index je Ansprechpartner greift nur auf `is_transferred = false`, damit ein Umzug nie fehlschlagen kann.
- Trigger auf `profiles`: ändert sich `assigned_caller_id`, setzt er bei offenen Terminen dieses Vics den neuen `caller_id` und `is_transferred = true`. Doppelbelegungen sind so möglich und werden in der Admin-Liste markiert.

**Frontend**

- `src/lib/booking.ts`: Slot-Generierung aus den Einstellungen (`generateTimeSlots(start, end, interval)`), Filter für Vorlaufzeit und Wochentage; Settings-Typen in `src/lib/settings.ts` erweitern.
- `src/components/BookingPanel.tsx`: Vic-Ansicht mit `Calendar` (shadcn) und Slot-Grid, liest belegte Slots über die RPC, bucht/storniert.
- `src/pages/Dashboard.tsx`: Reiter „Termin" in Navigation und Content-Switch, nutzt den bereits vorhandenen Ansprechpartner-Fallback (Caller oder Dr. Thomas Korte).
- `src/components/AdminAppointments.tsx` + Route `/admin/termine` in `src/App.tsx` und `src/pages/AdminPanel.tsx` (Titel-Map und Navigation, Gruppe Vertrieb).
- `src/components/AdminSettings.tsx`: neue Karte „Terminbuchung" im Branding-/System-Tab mit Uhrzeit-, Takt-, Wochentag- und Vorlaufzeit-Feldern.
- Telegram: neues Event `appointment_booked` in `src/lib/telegramNotify.ts` und der Event-Matrix, Meldung mit Vic, Ansprechpartner, Datum und Uhrzeit.
