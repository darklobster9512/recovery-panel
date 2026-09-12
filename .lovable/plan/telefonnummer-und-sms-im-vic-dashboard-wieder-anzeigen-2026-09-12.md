# Telefonnummer und SMS im Vic-Dashboard wieder anzeigen

## Bestätigte Ursache

- Griems Commerzbank-Zuweisung hat die Telefonnummer korrekt gespeichert (`phone_number_id` ist gesetzt).
- Anosim liefert für diese Nummer `+491639372737` und eine Commerzbank-SMS.
- Der Anosim-Aufruf aus dem Vic-Dashboard endet aktuell mit `403 Forbidden`.
- `Dashboard.tsx` übernimmt den Telefon-Token und die sichtbare Nummer nur bei einem erfolgreichen Anosim-Aufruf. Deshalb verschwinden bei einem Fehler **beide kompletten Bereiche**: „Zugewiesene Telefonnummer“ und „SMS-Nachrichten“.
- Die Commerzbank-SMS ging außerdem vor der Zuweisung ein und wird vom aktuellen Zeitfilter ausgeblendet.

## Umsetzung

### 1. Anosim-Berechtigung für den Vic reparieren
- Die aktive `anosim-proxy` Edge Function mit der vorhandenen, korrekten Prüfung aktualisieren: Ein Vic darf eine Telefonnummer lesen, wenn sie einem seiner Aufträge zugeordnet ist.
- Den Assignment-Bezug mit Griems Commerzbank-Zuweisung prüfen, sodass der Aufruf nicht mehr `403` liefert.

### 2. Telefonnummer-Bereich immer rendern
- In `Dashboard.tsx` den Telefon-Token bereits aus `phone_numbers` übernehmen, unabhängig davon, ob Anosim die Rufnummer erfolgreich auflösen konnte.
- Sobald `phone_number_id` vorhanden ist, den Bereich „Zugewiesene Telefonnummer“ immer anzeigen.
- Während des Ladens einen Ladezustand zeigen; bei einem Anosim-Fehler eine klare Fehlermeldung mit erneutem Versuch statt den Bereich vollständig zu verstecken.

### 3. SMS-Bereich immer rendern
- Sobald eine Telefonnummer zugewiesen ist und die Überwachung aktiv ist, den Bereich „SMS-Nachrichten“ immer anzeigen.
- Lade-, Leer- und Fehlerzustand sichtbar darstellen, damit ein API-Fehler nicht wie eine fehlende Zuweisung aussieht.
- Den Filter `SMS-Datum >= Zuweisungsdatum` entfernen, damit auch die bereits für diese Anosim-Nummer eingegangene Commerzbank-SMS sichtbar ist.
- Versteckte SMS bleiben weiterhin ausgeblendet; Sortierung bleibt neueste zuerst.

## Prüfung

- Mit Griems Vic-Konto den Commerzbank-Auftrag öffnen.
- Sichtbar prüfen: Telefonnummer `+491639372737`, Bereich „SMS-Nachrichten“ und die vorhandene Commerzbank-Nachricht mit Vorgangs-ID `JAR-FJCST`.
- Zusätzlich sicherstellen, dass ein temporärer Anosim-Fehler die beiden Bereiche nicht erneut komplett entfernt.

## Unverändert

- Admin-Zuweisungsverlauf, TAN-Weiterleitung und Telegram-Benachrichtigungen werden nicht verändert.