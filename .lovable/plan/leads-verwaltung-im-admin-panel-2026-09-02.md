# Leads-Verwaltung im Admin-Panel

Neuer Reiter „Leads" unter `/admin/leads` mit CSV-Import, Tabellenansicht, Detailseite, Notizen und Aktivitätsprotokoll.

## Datenbank

Drei neue Tabellen (RLS: nur Admins).

**`leads`**
- Kernfelder: `full_name`, `email`, `phone_number`, `schadenshoehe` (numeric), `vorfall` (text)
- Import-Metadaten: `imported_at`, `imported_by`, `source` (z. B. „csv"), `external_id` (die `id` aus der CSV, unique wenn gesetzt – verhindert Doppel-Imports), `raw` (jsonb, komplette CSV-Zeile für spätere Referenz)
- `status`: enum `lead_status` mit Werten `neu`, `in_bearbeitung`, `mailbox`, `fehlgeschlagen`, `erfolgreich` (default `neu`)

**`lead_notes`**
- `lead_id`, `author_id`, `content`, `created_at`
- Chat-Verlauf; Author-Email wird über join auf `profiles` gelesen

**`lead_activity`**
- `lead_id`, `actor_id`, `action` (text, z. B. `imported`, `status_changed`, `note_added`), `details` (jsonb, z. B. `{from, to}`), `created_at`
- Wird per Trigger befüllt: Insert in `leads` → `imported`; Update von `status` → `status_changed`; Insert in `lead_notes` → `note_added`
- Aktivitätsprotokoll oberhalb der Tabelle liest die letzten N Einträge (lead-übergreifend, mit Lead-Name)

Alle Tabellen mit `GRANT` an `authenticated`/`service_role` und Policy `has_role(auth.uid(),'admin')`.

## CSV-Import

Import-Popup mit File-Input. Parsing im Client:
- Datei kann UTF-16 LE mit BOM sein (wie der Upload) – wird via `TextDecoder('utf-16le')` gelesen, sonst UTF-8
- Trennzeichen: Tab (Fallback Komma/Semikolon per Auto-Detect)
- Mapping der 5 Pflichtspalten (case-insensitive, Umlaut-tolerant):
  - `schadenshöhe_(ca._betrag_in_eur)` → `schadenshoehe`
  - `was_ist_vorgefallen?` → `vorfall`
  - `full_name` → `full_name`
  - `email` → `email`
  - `phone_number` → `phone_number`
- `id`-Spalte → `external_id`; komplette Zeile → `raw`
- Preview vor dem Import (Zeilenzahl, erste 3 Zeilen), dann Batch-Insert
- Duplikate über `external_id` per `upsert(..., { onConflict: 'external_id', ignoreDuplicates: true })` überspringen

## UI

**`/admin/leads` (Tabellenseite)**
- Header: „Leads importieren"-Button (öffnet Popup)
- Aktivitätsprotokoll-Card (aufklappbar, letzte 50 Einträge, Format: `Zeit · Nutzer · Aktion · Lead-Name`)
- Tabelle in exakt dieser Spaltenreihenfolge:
  1. Importiert am
  2. Voller Name
  3. Telefonnummer
  4. Email
  5. Schadenshöhe (formatiert als EUR)
  6. Was ist vorgefallen? (auf ~60 Zeichen gekürzt mit „…", Klick öffnet Popup mit vollständigem Text)
  7. Status (farbige Badges, Inline-Dropdown zum Ändern)
  8. Aktionen: Auge-Icon → `/admin/leads/:id`, Notiz-Icon → Popup mit Notizen-Chat für diesen Lead
- Suche + Status-Filter oberhalb

**`/admin/leads/:id` (Detailseite)**
- Cards: Kontakt (Name, Email, Tel), Fall (Schadenshöhe, Vorfall komplett), Import-Info (Zeit, Quelle, external_id, komplettes `raw`-Objekt einklappbar)
- Status-Wechsel-Dropdown
- Notizen-Bereich als Chatverlauf (Bubbles mit Author-Email + Timestamp), Textarea + „Notiz speichern"-Button
- Lead-spezifisches Aktivitätsprotokoll unter den Notizen

## Routing & Navigation

- Neue Route `/admin/leads` und `/admin/leads/:id` in `src/App.tsx`
- Neuer Nav-Eintrag „Leads" (Icon: `Inbox`) in `src/pages/AdminPanel.tsx`, dispatch auf die neuen Komponenten:
  - `src/components/AdminLeads.tsx` (Liste + Import + Aktivität)
  - `src/components/AdminLeadDetail.tsx` (Detailseite)
  - `src/components/LeadImportDialog.tsx`
  - `src/components/LeadNotesDialog.tsx`

## Nicht enthalten

- Kein Mailversand, kein Outbound-Call
- Keine Bearbeitung der Lead-Stammdaten (nur Status + Notizen)
- Keine Zuweisung an Vics – kann später ergänzt werden
