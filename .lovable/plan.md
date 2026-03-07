

# Plan: Verifikationsfelder & Auftragszuweisung

## 1. Datenbank-Aenderungen

### Migration 1: `required_fields` Spalte auf `verifications`
```sql
ALTER TABLE public.verifications 
  ADD COLUMN required_fields text[] NOT NULL DEFAULT '{}';
```
Moegliche Werte: `identcode`, `identlink`, `email`, `username`, `password`, `phone`

### Migration 2: `verification_assignments` Tabelle
```sql
CREATE TABLE public.verification_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES public.verifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_values jsonb NOT NULL DEFAULT '{}',
  phone_number_id uuid REFERENCES public.phone_numbers(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.verification_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage verification_assignments"
  ON public.verification_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
```
`field_values` speichert z.B. `{"email": "test@x.com", "username": "user1", "password": "abc", "identcode": "123"}`.
`phone_number_id` verweist auf einen Eintrag in `phone_numbers` (wenn Telefonnummer aktiviert).

### Data-Update: BBVA
Per Insert-Tool: `UPDATE verifications SET required_fields = ARRAY['email','username','password','phone'] WHERE title = 'BBVA';`

## 2. UI-Aenderungen in `AdminVerifications.tsx`

### Template-Dialog: Required Fields Sektion
Unterhalb der bestehenden Felder (App Store / Play Store Links) eine neue Sektion **"Erforderliche Verifikationsdaten"** mit 6 Checkboxen:
- Identcode, Identlink, Email, Anmeldename, Passwort, Telefonnummer

State: `requiredFields: string[]`, Toggle-Logik, wird beim Speichern mitgesendet.

### Verifikations-Cards: "Zuweisen" Button
Neben dem Edit-Pencil ein neuer Button (UserPlus Icon). Oeffnet **Vic-Auswahl-Dialog**:

**Vic-Auswahl-Dialog:**
- Suchleiste oben
- Liste aller Vics (max 10 sichtbar, dann scrollen via ScrollArea)
- Klick auf Vic oeffnet den **Daten-Eingabe-Dialog**

**Daten-Eingabe-Dialog:**
- Zeigt nur die Felder, die im Template unter `required_fields` aktiviert sind
- Normale Input-Felder fuer: Identcode, Identlink, Email, Anmeldename, Passwort
- Fuer **Telefonnummer**: Dropdown (Select) mit allen Eintraegen aus `phone_numbers` (zeigt Nummer an) + Option "Neuen Anosim-Link hinzufuegen" die ein Eingabefeld einblendet. Bei Eingabe eines neuen Links wird dieser automatisch in `phone_numbers` gespeichert und der neue Eintrag ausgewaehlt.
- Speichern-Button erstellt Eintrag in `verification_assignments`

## 3. Dateien

| Datei | Aktion |
|---|---|
| Migration SQL | `required_fields` Spalte + `verification_assignments` Tabelle |
| Data Update | BBVA `required_fields` setzen |
| `src/components/AdminVerifications.tsx` | Checkboxen im Template-Dialog, Zuweisen-Button auf Cards, 2 neue Dialoge (Vic-Auswahl + Daten-Eingabe) |

