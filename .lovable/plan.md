

# Dashboard Detail-View: 3 Änderungen

## 1. SMS-Anzeige unter Telefonnummer

Die anosim-proxy gibt bereits SMS-Daten zurück (sichtbar in den Network Requests). Der Plan:

- **Assignment-Interface erweitern**: `phone_token` zum Assignment hinzufügen (wird beim Laden gespeichert)
- **SMS-State hinzufügen**: `smsMessages` State-Array mit auto-refresh alle 5 Sekunden
- **Filter nach `created_at`**: Nur SMS anzeigen, deren `messageDate` >= `assignment.created_at`
- **useEffect mit Interval**: Wenn Detail-View offen und `phone_token` vorhanden, alle 5s `anosim-proxy` aufrufen und SMS filtern
- **UI**: Neue Card unter der Telefonnummer-Sektion mit Titel "SMS-Nachrichten", jede SMS zeigt Absender, Datum/Uhrzeit und Text. Neuste zuerst. Copy-Button pro SMS-Text.

## 2. App Store / Play Store Badges ersetzen

- Uploaded SVGs nach `src/assets/app-store.svg` und `src/assets/google-play.svg` kopieren
- Import in Dashboard.tsx
- Die bisherigen `<Button variant="outline">` durch `<a><img>` mit den SVG-Badges ersetzen (Höhe ~40px)
- Links bleiben auf `appstore_url` / `playstore_url`

## 3. Zugangsdaten-Reihenfolge festlegen

Statt `Object.entries(field_values)` ungeordnet zu rendern, eine feste Sortierung:

```typescript
const FIELD_ORDER = ["identlink", "identcode", "email", "username", "password"];
```

FIELD_LABELS aktualisieren:
- `identlink` → "Identlink"
- `identcode` → "Identcode"  
- `email` → "E-Mail"
- `username` → "Anmeldename"
- `password` → "Passwort"

Die Credentials-Sektion iteriert über `FIELD_ORDER`, zeigt nur Felder an die in `field_values` existieren. Das `phone`-Feld wird aus den Credentials entfernt (hat ja eigene Card).

## Technische Details

### Dateien
- `src/pages/Dashboard.tsx` — Hauptänderungen
- `src/assets/app-store.svg` — kopiert von Upload
- `src/assets/google-play.svg` — kopiert von Upload

### SMS-Refresh-Logik
```
useEffect → wenn selectedId gesetzt und phone_token vorhanden:
  - Sofort SMS laden
  - setInterval(5000) für Refresh
  - Cleanup: clearInterval bei Deselect
  - Filter: sms.filter(m => new Date(m.messageDate) >= new Date(assignment.created_at))
  - Sortierung: neuste zuerst
```

