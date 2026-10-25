# Bereit zum Start: kompakte Karten mit Popup

## Ablauf
- Sobald das Prepare-Panel Ergebnisse für eine Anfrage schickt (mindestens ein Auftrag „bereit“ oder „nicht möglich“), verschwindet die Anfrage aus „Angeforderte Verifikationen“ und erscheint oben unter „Bereit zum Start“.
- Sind alle Aufträge einer Anfrage gestartet oder nicht möglich, verschwindet sie auch dort.

## Karte unter „Bereit zum Start“
- Gleicher Stil wie die angeforderten Karten (nur so breit wie nötig, nebeneinander), aber nicht ausgegraut: Name, Datum, „Eigene Bank: …“ und die Bank-Logos der Aufträge.
- Logos fertiger Aufträge in Farbe, noch laufende leicht ausgegraut, nicht mögliche mit rotem Rand.
- Die Karte ist klickbar (Zeiger, leichter Hover-Effekt).

## Popup beim Klick
- Oben die Vic-Daten zum Anrufen: Name, Telefonnummer (anklickbar zum Anrufen), E-Mail, Geburtsname, Geburtsdatum, Geburtsort, Adresse, Eigene Bank.
- Darunter die Aufträge wie bisher: Logo, Bankname, Video-Ident/Postident, Status „Bereit“ mit „Starten“, „In Bearbeitung“ oder rot „Auftrag nicht möglich“.
- Nach dem Starten verschwindet der Auftrag aus dem Popup; ist nichts mehr offen, schließt sich das Popup.

## Technisch
- `PreparedVerificationCards.tsx`: Gruppierung pro `request_id` statt pro Vic; lädt zusätzlich die zugehörigen `verification_requests` (Ausweisdaten, Bank) und `profiles.phone/email`; kompakte Karte + Dialog mit bestehender Start-Logik.
- `RequestVerificationsSection.tsx`: Anfragen ausblenden, deren Items nicht mehr alle `in_bearbeitung` sind (Items einmal laden bzw. Callback aus `PreparedVerificationCards`).
- Keine Datenbank- oder Edge-Function-Änderung.
