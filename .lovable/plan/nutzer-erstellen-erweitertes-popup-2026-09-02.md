# Nutzer erstellen – erweitertes Popup

Neuer Ablauf im "Nutzer erstellen"-Dialog unter `/admin/vics`.

## Neue Felder im Dialog

- **Lead auswählen (optional)**: Combobox (shadcn `Command` + `Popover`) mit Suchfunktion über alle Leads aus `public.leads` (Name, Email, Telefon). Auswahl füllt Vorname / Nachname (Split über `full_name`), Email und Telefon automatisch vor – bleibt danach editierbar.
- **Passwort**: Wird beim Öffnen des Dialogs automatisch generiert und im Feld angezeigt. Daneben Button "Neu generieren" (Refresh-Icon) und "Kopieren". Vor dem Anlegen bestätigt der Admin das Passwort einfach durch Klick auf "Erstellen".
- **Guthaben**: Numerisches Eingabefeld (EUR, `numeric`).
- **Scam Projekt**: Textfeld (z. B. "XYZ Investment"), freier Text.

Passwortregeln: nur `a–z` und `0–9`, alles klein, Länge 8. Klartext-Speicherung in `profiles.temp_password` bleibt wie bisher.

## Datenbank

Migration ergänzt `public.profiles`:

- `balance numeric` (nullable)
- `scam_project text` (nullable)

Bestehende RLS-Policies decken die neuen Spalten automatisch mit ab.

## Edge Function `create-user`

- Passwort wird **nicht mehr** in der Function generiert, sondern vom Client übergeben (`password`-Feld). Serverseitige Validierung: `^[a-z0-9]{6,32}$`.
- Neue optionale Felder `balance`, `scam_project` werden in das `profiles`-Update übernommen.
- Rückgabewert enthält weiterhin das Passwort (identisch mit Input) für die Toast-Anzeige.

## Frontend

- `src/components/AdminVics.tsx`: neuer State (`password`, `balance`, `scam_project`, `leadId`), Lead-Fetch (`select id, full_name, email, phone_number` – Limit 500) beim Öffnen des Dialogs, Passwort-Generator-Helper, Combobox-UI.
- `handleCreate` schickt `password`, `balance` (parseFloat), `scam_project` mit.

## Technische Details

- Passwort-Generator im Client (`crypto.getRandomValues`), gleiche Zeichenklasse wie Server-Regex.
- Combobox nutzt vorhandenes `command.tsx`-Primitive.
- Lead-Liste wird nur bei Dialog-Open geladen (kein Dauer-Subscribe).
- Keine Tabellenanzeige der neuen Felder in dieser Iteration; auf Wunsch später ergänzbar.
