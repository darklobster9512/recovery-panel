# Vic-Profil im Nachhinein bearbeiten

Auf der Vic-Detailseite (`/admin/vics/:id`) einen "Bearbeiten"-Button in der Profil-Card hinzufügen, der ein Dialog öffnet zum Ändern der Vic-Daten.

## Bearbeitbare Felder
- Vorname
- Nachname
- Email
- Telefon
- Guthaben (numeric, Euro-Eingabe)
- Scam Projekt (Text)
- Temp. Passwort (optional, editierbar)

## UI
- Neuer "Bearbeiten"-Button (icon + label) in der Profil-Card oben rechts, neben dem Caller-Selector.
- Klick öffnet einen shadcn `Dialog` mit Formularfeldern, vorbefüllt mit aktuellen Werten.
- Speichern → `supabase.from("profiles").update({...}).eq("id", profile.id)`, danach `fetchData()` und Toast.
- Auch die Info-Card in der Dashboard-Sidebar profitiert automatisch (liest live aus `profiles`).

## Technisches
- Edit passiert in `src/components/AdminVicDetail.tsx`.
- `VicProfile`-Type um `balance` und `scam_project` erweitern.
- Balance im Read-Modus zusätzlich in `infoItems` anzeigen (formatiert mit `formatEur`).
- Scam Projekt ebenfalls in `infoItems` anzeigen.
- Keine Migration nötig — Spalten `balance` und `scam_project` existieren bereits auf `profiles`.
- Bestehende RLS erlaubt Admin-Updates auf `profiles`; keine Policy-Änderung nötig.
