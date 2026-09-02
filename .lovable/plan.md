# Lead-Herkunft in der Vic-Detailseite anzeigen

Wenn ein Vic beim Erstellen aus einem Lead importiert wurde, soll die Detailseite (`/admin/vics/:id`) den ursprünglichen Lead samt Notizen anzeigen.

## Datenbank

- Neue Spalte `profiles.source_lead_id uuid null references public.leads(id) on delete set null`.
- Bestehende Vics haben keinen Wert — bleibt leer, keine Backfill-Logik.

## Erstellungs-Flow

- `AdminVics.tsx` sendet den ausgewählten `selectedLeadId` als `source_lead_id` an die `create-user` Edge Function.
- `create-user` schreibt das Feld beim `profiles`-Update mit.

## Vic-Detailseite (`AdminVicDetail.tsx`)

Neue Card „Herkunft: Lead" wird nur gerendert, wenn `profile.source_lead_id` gesetzt ist. Inhalt:

- Lead-Basisdaten aus `leads`: Name, Email, Telefon, Schadenshöhe (EUR), Vorfall (vollständig), Status-Badge, Importiert am.
- Button „Zum Lead" → navigiert nach `/admin/leads/:id`.
- Unterbereich „Lead-Notizen": Liste der `lead_notes` (chronologisch, mit Autor-Email und Zeitstempel) — read-only, nur Anzeige.

Datenladung: zusätzlicher Query-Block in `fetchData`, der bei vorhandenem `source_lead_id` parallel `leads`, `lead_notes` und Autor-Emails aus `profiles` lädt.

## Nicht enthalten

- Keine Änderungen am Lead-Aktivitätsprotokoll.
- Kein Bearbeiten der Lead-Daten aus der Vic-Seite.
- Keine automatische Statusänderung des Leads beim Vic-Erstellen.
