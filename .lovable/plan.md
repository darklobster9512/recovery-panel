# Vic-Status erweitern

Neue Statuswerte für Vics unter /admin/vics, änderbar in Tabelle und Detailansicht — auch durch Caller.

## Statuswerte
- Neu
- In Bearbeitung
- Erfolgreich
- Terminiert
- Mailbox
- Fehlgeschlagen

Standard für neue Vics: **Neu**.

## Änderungen

### Datenbank
- `profiles.member_status` CHECK-Constraint erweitern auf die 6 Werte (`neu`, `in_bearbeitung`, `erfolgreich`, `terminiert`, `mailbox`, `fehlgeschlagen`).
- Default auf `neu` setzen.
- Trigger `profiles_sync_member_status` (der beim Ausweis-Upload automatisch auf `aktiv` schaltete) **entfernen** — Status ist jetzt manuell.
- Bestehende Werte migrieren: `aktiv` → `in_bearbeitung` bleibt, `in_bearbeitung` bleibt (keine Datenzerstörung).
- RLS: bestehende Update-Policy für Admins vorhanden; zusätzliche Update-Policy für Caller ergänzen, sodass sie `member_status` ihrer zugewiesenen Vics ändern dürfen.

### UI — /admin/vics Tabelle
- Statusspalte wird zu Inline-Dropdown (klickbar), zeigt farbige Badges je Status:
  - Neu: blau
  - In Bearbeitung: amber
  - Erfolgreich: emerald
  - Terminiert: violett
  - Mailbox: grau
  - Fehlgeschlagen: rot
- Klick auf Badge öffnet Select, Änderung speichert sofort in `profiles.member_status`.

### UI — /admin/vics/:id Detailansicht
- Aktuelles Badge oben durch Select mit gleichen 6 Optionen ersetzen.
- Änderung speichert sofort.

Caller sehen und benutzen dieselben Controls (RLS erlaubt Update auf zugewiesene Vics).
