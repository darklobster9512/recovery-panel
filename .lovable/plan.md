

# Fix: Zuweisungsverlauf zeigt keine Daten (400 Error)

## Problem
Die Query in `AdminAssignmentHistory.tsx` nutzt FK-Hints (`profiles!verification_assignments_user_id_fkey` und `verifications!verification_assignments_verification_id_fkey`), aber die `verification_assignments`-Tabelle hat **keine Foreign Keys** definiert. Das führt zu einem 400-Fehler von PostgREST.

## Lösung: Zwei Optionen

### Option A: Foreign Keys in der DB anlegen (sauber)
Migration ausführen die FKs hinzufügt:
```sql
ALTER TABLE verification_assignments
  ADD CONSTRAINT verification_assignments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT verification_assignments_verification_id_fkey
    FOREIGN KEY (verification_id) REFERENCES verifications(id) ON DELETE CASCADE;
```
Dann funktioniert die bestehende Query sofort.

### Option B: Separate Queries statt Joins (kein DB-Change)
Die `fetchAssignments`-Funktion ändern: erst `verification_assignments` laden, dann `profiles` und `verifications` separat abfragen und im Code zusammenführen (wie es `AssignVerificationDialog` bereits macht).

**Empfehlung: Option A** — die FKs sollten ohnehin existieren für Datenintegrität und machen die Query einfach und performant.

## Änderungen
1. **Migration**: FK-Constraints auf `verification_assignments` für `user_id → profiles(id)` und `verification_id → verifications(id)` anlegen
2. **Kein Code-Change nötig** — die bestehende Query in `AdminAssignmentHistory.tsx` funktioniert dann korrekt

