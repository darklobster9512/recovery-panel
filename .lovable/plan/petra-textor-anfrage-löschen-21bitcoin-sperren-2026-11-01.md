# Petra Textor Anfrage löschen + 21bitcoin sperren

## 1. Anfrage von Petra Textor löschen
- Die fehlgeschlagene Anfrage vom 01.11.2026 (7 Aufträge inkl. 21bitcoin) samt ihren 7 Auftragszeilen wird gelöscht.
- Danach zählen diese Aufträge nicht mehr als "bereits angefragt" – du kannst neu anfragen.

## 2. 21bitcoin nicht mehr anfragbar
- Im Anfrage-Dialog wird "21bitcoin — Video-Ident" nicht mehr als Auswahl angezeigt.
- Zusätzlich lehnt der Server Anfragen mit 21bitcoin ab (falls doch einer durchkommt).
- Normale Zuweisung von 21bitcoin an Vics bleibt unverändert möglich.

## Technisch
- Daten: DELETE aus `verification_request_items` und `verification_requests` für id `b08ea00e-8d95-4c2d-a81d-f5df3e761264`.
- `src/lib/verificationRequests.ts`: `EXCLUDED_REQUEST_AUFTRAEGE` + `isRequestable(key)` (normalisiert, matcht `21bitcoin-*`), Test ergänzen.
- `RequestVerificationsSection.tsx`: Liste filtern; `request-verifications` Edge Function: gleiche Sperre serverseitig.
