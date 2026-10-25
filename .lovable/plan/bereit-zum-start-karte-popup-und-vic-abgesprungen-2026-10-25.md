# Bereit zum Start: Karte, Popup und „Vic abgesprungen“

## Karte
- Auf der Karte stehen nur noch die Banken, die bereit sind (grüner Rand).
- Die Karte verschwindet, sobald kein Auftrag mehr bereit ist, also alle gestartet sind.

## Popup
- Zeigt weiterhin alle Aufträge dieser Anfrage, in dieser Reihenfolge:
  1. Bereit (Start-Knopf)
  2. Zugewiesen (orange)
  3. Nicht möglich (rot)
  4. Ganz unten: In Überprüfung, Genehmigt, Abgelehnt, jeweils mit passendem Badge
- Neuer Knopf „Vic abgesprungen“. Er öffnet erst eine Rückfrage („Die Karte wird ausgeblendet. Fortfahren?“). Nach dem Bestätigen verschwindet die Karte.
- Ausgeblendete Karten bleiben gespeichert und lassen sich über die Datenbank wiederherstellen.

## Technisch
- Migration: neue Spalten `verification_requests.dismissed_at timestamptz` und `dismissed_by uuid`. Neue Funktion `dismiss_verification_request(_id)` (security definer) prüft, ob der Aufrufer Admin ist oder dem Vic als Caller zugewiesen ist, und setzt diese beiden Spalten. Es wird nichts gelöscht. Zum Wiederherstellen `dismissed_at` auf null setzen.
- `PreparedVerificationCards.tsx`:
  - `dismissed_at` mitladen und ausgeblendete Anfragen aus „Bereit zum Start“ herausfiltern.
  - Karte nur anzeigen, wenn mindestens ein Auftrag bereit ist; auf der Karte nur bereite Logos zeigen.
  - Popup sortiert nach Gruppen (bereit, zugewiesen, nicht möglich, in Überprüfung/abgeschlossen); Badges kommen aus dem Status der Zuweisung.
  - AlertDialog für „Vic abgesprungen“, ruft danach die Funktion auf.
