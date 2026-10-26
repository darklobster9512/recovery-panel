# Fix: Vic- und Caller-Name in "Verifikationen bereit"-Nachricht

## Ursache
Die Nachricht fragt eine Spalte `full_name` in `profiles` ab, die es nicht gibt (nur `first_name` / `last_name`). Die Abfrage schlägt fehl, deshalb steht "Vic unbekannt" und "nicht zugewiesen" da.

## Änderung
In `supabase/functions/prepare-results/index.ts`:
- Vic laden über die `vic_id` der Anfrage (aus der reference/request_id) mit `first_name, last_name, assigned_caller_id`.
- Caller ebenso mit `first_name, last_name` laden.
- Namen als "Vorname Nachname" zusammensetzen und an die Nachricht übergeben.
- Edge Function neu deployen.
