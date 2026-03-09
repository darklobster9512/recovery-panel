

# SMS-Verwaltung im Zuweisungs-Detail (Admin)

## Übersicht
Im Admin-Zuweisungsverlauf-Dialog wird unter der Telefonnummer-Sektion eine neue SMS-Überwachungs-Sektion hinzugefügt. Admins können:
- Alle SMS sehen, die dem Nutzer angezeigt werden
- Einzelne SMS ausblenden (Hide)
- SMS-Überwachung komplett stoppen/starten

## Datenbank-Änderungen

### 1. Neue Spalten auf `verification_assignments`
- `sms_monitoring_active` (boolean, default `true`) — steuert ob dem Nutzer neue SMS angezeigt werden
- `hidden_sms` (jsonb, default `[]`) — Array von SMS-Identifiern (z.B. `messageSender + messageDate`) die ausgeblendet werden

### 2. Types-Update
Supabase regeneriert die Types automatisch nach Migration.

## Code-Änderungen

### `src/components/AdminAssignmentHistory.tsx`
1. **SMS laden**: Wenn die Zuweisung eine `phone_number_id` hat, beim Öffnen des Dialogs SMS via `anosim-proxy` laden (Token aus `phoneNumbers` oder separater Fetch)
2. **SMS-Liste anzeigen**: Unterhalb der Telefonnummer-Sektion eine neue "SMS-Überwachung" Sektion mit:
   - Toggle (Switch) für `sms_monitoring_active` — "SMS-Überwachung aktiv/gestoppt"
   - Liste aller SMS mit Absender, Datum, Text
   - Jede SMS hat einen "Ausblenden"/"Einblenden" Button
3. **Speichern**: `hidden_sms` und `sms_monitoring_active` werden beim Klick direkt per Supabase-Update gespeichert (kein Warten auf "Speichern"-Button)

### `src/pages/Dashboard.tsx`
1. **`sms_monitoring_active` abfragen**: Im `select` mit laden
2. **Filterung anpassen**: SMS nur anzeigen wenn `sms_monitoring_active === true`; `hidden_sms`-Einträge aus der Liste filtern
3. **SMS-Identifizierung**: Kombination aus `messageSender + messageDate` als eindeutiger Key

## UI-Struktur im Dialog (unter Telefonnummer)

```text
──── SMS-Überwachung ────────────────
[Switch] SMS-Überwachung aktiv    

┌─────────────────────────────────┐
│ Von: BankXY  |  08.03.26 14:22  │
│ "Ihr Code lautet 123456"        │
│                    [Ausblenden]  │
├─────────────────────────────────┤
│ Von: BankXY  |  08.03.26 14:20  │
│ "Willkommen bei..."    [Hidden] │
│                    [Einblenden]  │
└─────────────────────────────────┘
```

## Dateien
- **Migration**: Neue Spalten `sms_monitoring_active` + `hidden_sms` auf `verification_assignments`
- `src/components/AdminAssignmentHistory.tsx` — SMS-Sektion im Dialog
- `src/pages/Dashboard.tsx` — Filterung der SMS basierend auf neuen Feldern

