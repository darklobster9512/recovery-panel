# Bereits gemachte Aufträge bei „Verifikation anfragen“ sperren

## Was sich ändert
- Nach Auswahl eines Vics prüft das Popup, welche Aufträge er schon hat:
  - alle ihm bereits zugewiesenen Aufträge (egal ob zugewiesen, in Bearbeitung, in Überprüfung, genehmigt, abgelehnt oder abgeschlossen),
  - alle früher für ihn angefragten Aufträge (auch fehlgeschlagene / „nicht möglich“), außer bei Anfragen, die mit „Vic abgesprungen“ ausgeblendet wurden.
- Diese Aufträge sind in Schritt 3 nicht wählbar und stehen unten in einer eigenen Gruppe „Bereits bearbeitet“ mit Vermerk, z. B. „Bereits zugewiesen“, „Bereits angefragt“ oder „Fehlgeschlagen“.
- Sie werden auch aus der Vorauswahl entfernt und nicht mitgeschickt.

## Technisch
- `RequestVerificationsSection.tsx`: beim Vic-Wechsel parallel `verification_assignments` (verification_id, status; `user_id = vic`) und `verification_request_items` (auftrag_key, verification_id, status; `vic_id = vic`) laden; Request-IDs mit `dismissed_at` ignorieren. Map key -> Grund bilden (über `auftragKey`/verification_id), mit `blockedBanks` zu einer Sperrliste zusammenführen.
- Server-Absicherung in `request-verifications`: bereits vorhandene Aufträge des Vics werden abgelehnt (400), damit nichts doppelt angefragt wird.
- Kleiner Test für die Zusammenführungs-Logik in `src/test/verificationRequests.test.ts`.
