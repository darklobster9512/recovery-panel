# Telefonnummer beim Import ohne "p:" speichern

## Änderungen

1. **Import-Parser bereinigen** (`src/lib/leads.ts`)
   - In `parseLeadsFile` beim Auslesen von `phone_number` einen führenden `p:` (case-insensitive, mit optionalem Whitespace) entfernen.
   - Helper-Funktion `normalizePhone(value)` einführen und zusätzlich Whitespace an den Rändern trimmen.

2. **Bestehende Leads bereinigen** (SQL, via run_sql)
   - `UPDATE public.leads SET phone_number = regexp_replace(phone_number, '^\s*p:\s*', '', 'i') WHERE phone_number ~* '^\s*p:'`

## Nicht im Scope
- Keine Änderungen an Tabelle, RLS oder anderen Feldern.
