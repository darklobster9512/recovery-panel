# Caller: Telefonnummern hinzufügen erlauben

Aktuell dürfen nur Admins in `/admin/telefonnummern` neue anosim-Nummern hinzufügen oder löschen. Caller sollen dieselben Rechte wie Admins auf dieser Seite bekommen.

## Änderungen

- Datenbank: RLS-Policy auf `public.phone_numbers` erweitern, sodass auch Rolle `caller` INSERT/UPDATE/DELETE ausführen darf (bisher nur `admin`).
- UI (`src/components/AdminPhoneNumbers.tsx`): Die `role === "admin"`-Gates für den „Hinzufügen"-Bereich, die Aktionen-Spalte und den Löschen-Button auf `admin` oder `caller` erweitern.

Vics bleiben unverändert (nur Lesezugriff auf ihre zugewiesene Nummer).
