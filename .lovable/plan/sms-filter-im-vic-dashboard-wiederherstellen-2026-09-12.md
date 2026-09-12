# SMS-Filter im Vic-Dashboard wiederherstellen

## Problem
Nach der letzten Änderung werden im Auftrags-Popup alle SMS der Nummer angezeigt — auch solche, die vor der Zuweisung eingegangen sind. Der Filter `messageDate >= assignment.created_at` wurde dabei entfernt.

## Fix
In `src/pages/Dashboard.tsx` (`fetchSms`) den Datumsfilter wieder hinzufügen:

```text
SMS laden (anosim-proxy)
  → versteckte SMS herausfiltern (hidden_sms)        [bleibt]
  → SMS vor assignment.created_at herausfiltern       [NEU wieder da]
  → nach Datum absteigend sortieren                   [bleibt]
```

- Nur SMS mit `messageDate >= selected.created_at` werden angezeigt.
- Alles andere (Telefonnummer-Anzeige, Fehleranzeige, Auto-Refresh) bleibt unverändert.

## Technische Details
- Datei: `src/pages/Dashboard.tsx`, Funktion `fetchSms`
- Bedingung: `new Date(sms.messageDate).getTime() >= new Date(selected.created_at).getTime()`
- `selected.created_at` muss in den `useCallback`-Dependencies ergänzt werden.
