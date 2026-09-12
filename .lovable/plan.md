# Commerzbank-Zuweisung: Nummer & SMS erscheinen nicht

## Was geprüft wurde

- Zuweisung `61d76ea3…` (Griem → Commerzbank) hat `phone_number_id` gesetzt.
- Anosim liefert für die Nummer `+491639372737` Daten inkl. einer Commerzbank-SMS.
- Die einzige SMS („Vorgangs-ID JAR-FJCST") kam am **12.09. 09:18:17 UTC** – die Zuweisung wurde aber erst **12.09. 09:41:37 UTC** angelegt.
- Beide Views (`AdminAssignmentHistory` Popup und Vic-`Dashboard`) filtern SMS mit `messageDate >= assignment.created_at`, wodurch diese SMS ausgeblendet wird ⇒ „Keine SMS seit Zuweisung eingegangen".
- Zusätzlich: Im Admin-Popup wird die Telefonnummer nur über den Dropdown angezeigt, der 17 Nummern parallel via Anosim-Proxy auflöst. Bei Rate-Limits fallen einzelne Einträge auf den Token zurück, was wie „keine Nummer" wirkt.

## Fix

### 1. SMS-Zeitfilter entfernen (beide Views)
- `src/components/AdminAssignmentHistory.tsx` (`loadSmsForAssignment`): den `>= assignedAt`-Filter streichen und alle vom Anosim-Endpunkt gelieferten SMS anzeigen (sortiert nach Datum, absteigend). `hidden_sms`-Filter bleibt erhalten.
- `src/pages/Dashboard.tsx` (SMS-Polling im Vic-Bereich): denselben Zeitfilter entfernen. Vic sieht alle SMS an seiner zugewiesenen Nummer.

### 2. Zugewiesene Nummer prominent im Admin-Popup zeigen
- Direkt unter „Telefonnummer"-Dropdown im Popup einen Read-only-Block „Aktuell zugewiesen: +49…" rendern. Quelle: einmaliger `anosim-proxy`-Call für `selected.phone_number_id` (unabhängig vom Bulk-Loading der Dropdown-Liste). So ist die Nummer auch sichtbar, wenn der Bulk-Fetch der 17 Nummern noch läuft oder gerate-limited wird.

### 3. Bulk-Loading entlasten
- `fetchPhoneNumbers` in `AdminAssignmentHistory.tsx`: statt 17 parallele Requests, Promise-Pool mit maximal 4 gleichzeitigen Anosim-Aufrufen (kleiner Helper), damit weniger 429/leere Antworten und der Dropdown die Nummern zuverlässig zeigt.

## Nicht Teil dieses Plans
- Kein neues Backend/RLS – Rechte und Anosim-Proxy funktionieren.
- Keine Änderung am TAN-Weiterleiten oder an Telegram-Events.
