

# Zuweisungsverlauf-Sektion auf /admin/verifikationen

## Übersicht
Unterhalb der bestehenden Verifikations-Cards eine neue Sektion "Zuweisungsverlauf" hinzufügen, die alle `verification_assignments` als Liste/Tabelle anzeigt (Datum, Uhrzeit, Nutzer, Auftrag). Beim Klick auf einen Eintrag öffnet sich ein Detail-Dialog mit editierbaren Feldern.

## Datenquelle
- Tabelle `verification_assignments` mit Join auf `profiles` (Nutzerdaten) und `verifications` (Auftragsname/Logo)
- Telefonnummer-Auflösung via `anosim-proxy` Edge Function (wie bereits in AssignVerificationDialog)

## Änderungen

### 1. Neue Komponente: `src/components/AdminAssignmentHistory.tsx`
- Fetch: `verification_assignments` mit `select("*, profiles:user_id(id, email, first_name, last_name, phone, temp_password), verifications:verification_id(id, title, logo_url, required_fields)")`, sortiert nach `created_at desc`
- Darstellung als Card mit Titel "Zuweisungsverlauf", darunter eine Tabelle:
  - Spalten: Datum/Uhrzeit, Nutzer (Name + Email), Auftrag (Titel + Logo), Zuweiser
  - Zeilen klickbar
- State für `selectedAssignment` — beim Klick öffnet sich ein Dialog

### 2. Detail/Edit-Dialog (innerhalb der gleichen Komponente)
- Zeigt Benutzerinfos (Name, Email, Telefon, ggf. temp_password) als read-only
- Zeigt zugewiesene Felder (`field_values`) als editierbare Inputs
- Telefonnummer-Auswahl/Änderung (Select aus `phone_numbers` + Option für neuen Anosim-Link, wie im AssignVerificationDialog)
- Speichern-Button: `supabase.from("verification_assignments").update({ field_values, phone_number_id }).eq("id", assignment.id)`
- Optional: Löschen-Button zum Entfernen der Zuweisung

### 3. Einbindung in `AdminVerifications.tsx`
- Import `AdminAssignmentHistory` und unterhalb des Card-Grids rendern, mit `mt-8` Abstand
- FIELD_LABELS Konstante in eine shared Datei oder duplizieren (klein genug zum Duplizieren)

### Kein DB-Schema-Change nötig
Die `verification_assignments` Tabelle hat bereits alle benötigten Spalten und Foreign Keys werden über die Query aufgelöst.

