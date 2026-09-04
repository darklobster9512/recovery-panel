# Vics einem Caller zuweisen – Mehrfachauswahl & Spalte

## Was neu ist auf der Vics-Seite

1. **Neue Spalte „Caller"** – zeigt den Namen des zugewiesenen Callers, sonst „–".
2. **Auswahl-Kästchen** in jeder Zeile plus eines im Tabellenkopf (alles auswählen / abwählen, bezogen auf die aktuell gefilterte Liste).
3. **Aktionsleiste**, die erscheint sobald mindestens ein Vic ausgewählt ist: „X ausgewählt", Auswahl der Caller-Zuweisung und Button „Zuweisen". Damit lassen sich mehrere Vics in einem Schritt demselben Caller zuweisen; „Nicht zugewiesen" entfernt die Zuweisung.
4. **Einzel-Zuweisung**: neben dem Augen-Symbol ein zweites Symbol (Personen-Symbol). Klick öffnet ein kleines Fenster mit dem Namen des Vics und der Caller-Auswahl zum Speichern.

Nach jeder Zuweisung wird die Liste aktualisiert, die Auswahl geleert und eine kurze Bestätigung angezeigt.

## Technische Details

- `src/components/AdminVics.tsx`:
  - `VicUser` um `assigned_caller_id` erweitern; Feld in der `profiles`-Abfrage mitladen.
  - Caller einmalig laden (`user_roles` mit `role = 'caller'`, dann `profiles`), als Map `id -> Anzeigename` für die neue Spalte.
  - `selectedIds: Set<string>` als State; Kopf-Checkbox arbeitet auf `filtered`.
  - Bulk-Update: `supabase.from("profiles").update({ assigned_caller_id }).in("id", ids)`, danach `fetchUsers()`.
  - Einzel-Dialog: gleiche Logik mit einer ID; wiederverwendete Caller-Liste, Select aus shadcn.
  - Zeilenklick-Navigation bleibt, Checkbox- und Icon-Zellen stoppen das Event.
- Keine Datenbankänderung nötig – `profiles.assigned_caller_id` existiert bereits, ebenso die Zuweisungslogik in `AssignCallerSelect.tsx` (bleibt für die Detailseite unverändert).
