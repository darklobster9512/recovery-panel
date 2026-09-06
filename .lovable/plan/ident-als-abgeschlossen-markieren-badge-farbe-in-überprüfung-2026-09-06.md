# Ident als abgeschlossen markieren + Badge-Farbe "In Überprüfung"

## Änderungen

1. **`src/components/AdminAssignmentHistory.tsx`** – Im geöffneten Zuweisungs-Dialog einen Button „Ident abgeschlossen“ ergänzen (nur sichtbar, wenn Status nicht bereits `in_ueberpruefung`, `genehmigt`, `abgelehnt` oder `abgeschlossen` ist). Klick setzt `status = 'in_ueberpruefung'` in `verification_assignments`, aktualisiert lokalen State und schließt/refresht die Ansicht.

2. **`src/components/AssignmentStatusBadge.tsx`** – Klasse für `in_ueberpruefung` ändern auf ein helles Grün (Emerald), damit es sich klar vom orangen „Zugewiesen“ absetzt, aber nicht wie das satte Success-Grün von „Abgeschlossen/Genehmigt“ wirkt:
   ```
   border-emerald-300 bg-emerald-100 text-emerald-700
   ```

## Nicht Teil dieser Änderung
- Keine RLS-/DB-Migrationen (Status-Update ist über bestehende Policies möglich).
- Keine Änderungen an Telegram-Benachrichtigungen oder anderen Status-Flows.
