

# Admin Dashboard mit echten Daten

## Übersicht
Das Dashboard unter `/admin` wird von statischen Platzhalterwerten auf echte, live aus Supabase geladene Daten umgestellt. Es zeigt eine Zusammenfassung aller anderen Reiter.

## Neue Komponente: `src/components/AdminDashboard.tsx`

### Stat-Cards (obere Reihe, 4 Karten)
Echte Zähler aus Supabase:
- **Gesamt Vics**: `COUNT` aus `user_roles` WHERE `role = 'user'`
- **Zuweisungen offen**: `COUNT` aus `verification_assignments` WHERE `status = 'zugewiesen'`
- **Zuweisungen in Bearbeitung**: `COUNT` aus `verification_assignments` WHERE `status = 'in_bearbeitung'`
- **Abgeschlossen**: `COUNT` aus `verification_assignments` WHERE `status = 'abgeschlossen'`

### Letzte Zuweisungen (Tabelle, max 5)
- Query: `verification_assignments` sortiert nach `created_at desc`, limit 5
- Separate Queries für `profiles` und `verifications` (wie in AdminAssignmentHistory)
- Spalten: Datum, Nutzer, Auftrag, Status (Badge)
- Zeilen klickbar → navigiert zu `/admin/vics/:user_id`

### Letzte SMS (Tabelle, max 5)
- Query: `sms_spoof_history` sortiert nach `created_at desc`, limit 5
- Spalten: Datum, Empfänger, Absender, Nachricht (gekürzt)

### Quick-Links / Aktionen
- Buttons: "Nutzer erstellen" → `/admin/vics`, "Verifikation erstellen" → `/admin/verifikationen`

## Änderungen an `AdminPanel.tsx`
- Import `AdminDashboard`
- Im Dashboard-else-Branch `<AdminDashboard />` statt der statischen Cards rendern
- Statische `stats`-Array und Systemübersicht-Card entfernen

