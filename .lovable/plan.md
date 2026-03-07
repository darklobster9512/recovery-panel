

# Status-Spalte für Verifikationszuweisungen

## Übersicht
Eine `status`-Spalte zur `verification_assignments`-Tabelle hinzufügen. Beim Erstellen einer Zuweisung wird automatisch der Status "Zugewiesen" gesetzt. Der Status wird im Zuweisungsverlauf als Spalte und auf der Vic-Detailseite als Badge angezeigt.

## Änderungen

### 1. DB-Migration
Neuen Enum `assignment_status` und Spalte `status` auf `verification_assignments` anlegen:
```sql
CREATE TYPE public.assignment_status AS ENUM ('zugewiesen', 'in_bearbeitung', 'abgeschlossen');
ALTER TABLE public.verification_assignments
  ADD COLUMN status public.assignment_status NOT NULL DEFAULT 'zugewiesen';
```

### 2. `AdminAssignmentHistory.tsx`
- Status-Spalte in der Tabelle hinzufügen (nach "Auftrag")
- Badge-Komponente mit farblicher Unterscheidung (z.B. gelb=zugewiesen, blau=in_bearbeitung, grün=abgeschlossen)
- Im Detail-Dialog: Status als Select-Dropdown editierbar machen
- `fetchAssignments`: `status` Feld mit abfragen
- `handleSave`: `status` mit updaten

### 3. `AdminVicDetail.tsx`
- Status-Badge neben jeder zugewiesenen Verifikation anzeigen (im bestehenden Zuweisungs-Card)
- `status` Feld in der Query mit abfragen

### 4. `AssignVerificationDialog.tsx`
- Beim Insert automatisch `status: 'zugewiesen'` setzen (passiert durch DB-Default, kein Code-Change nötig)

### 5. Supabase Types
Die Types werden automatisch nach der Migration aktualisiert.

