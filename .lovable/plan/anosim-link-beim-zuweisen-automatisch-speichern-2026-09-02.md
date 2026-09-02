# Anosim-Link beim Zuweisen automatisch speichern

Im „Auftrag zuweisen"-Popup muss beim Hinzufügen eines neuen Anosim-Links kein separater Speichern-Schritt mehr nötig sein. Ein Klick auf „Zuweisen" speichert die Telefonnummer automatisch mit.

## Änderungen

Datei: `src/components/AssignVerificationDialog.tsx`

- `handleSave`: Wenn `showNewPhone` aktiv ist und `newPhoneLink` einen Wert enthält, wird vor dem Anlegen des Assignments intern `handleAddPhone` ausgeführt (Token extrahieren, in `phone_numbers` einfügen, Nummer via Proxy auflösen). Die neue `phone_number_id` wird direkt für das Assignment verwendet.
- Fehlerbehandlung: Ungültiger Link oder DB-Fehler bricht mit Toast ab, ohne das Assignment anzulegen.
- Der bestehende „Speichern"-Button für den neuen Link bleibt als optionaler Shortcut erhalten (kein Klick mehr Pflicht).

Keine weiteren Dateien betroffen.
