# SMS bei Kontoerstellung prüfen und sichtbar machen

## Befund (aktueller Stand)
- Beim Anlegen eines Vic-Kontos (auch aus Leads) wird eine SMS über seven.io verschickt, wenn eine Telefonnummer und die Vorlage „new_user_sms“ vorhanden sind. Beides ist der Fall.
- In den letzten 7 Tagen wurden 111 Vic-Konten angelegt, alle bei **Berthold & Partner**, alle mit Telefonnummer. Bei Korte keine neuen Konten.
- Berthold hat einen **eigenen seven.io-Schlüssel** hinterlegt. Wenn du im Korte-seven.io-Konto nachschaust, siehst du diese SMS nicht – sie würden im Konto des Berthold-Schlüssels landen.
- Absendername bei Berthold ist „Kanzlei B&P“. Das „&“ (und evtl. das Leerzeichen) ist bei seven.io als Absender oft nicht erlaubt.
- seven.io meldet Fehler (falscher Absender, kein Guthaben, ungültiger Schlüssel) mit einem Code im Antworttext, nicht als Fehlerstatus. Unsere Funktion wertet das nicht aus und speichert das Ergebnis nirgends – Fehler bleiben daher unsichtbar.

Ursache ist damit noch nicht sicher bestätigt; Schritt 1 klärt sie.

## Plan
1. **Diagnose:** Einmalig mit dem Berthold-Schlüssel bei seven.io Kontostand/Gültigkeit abfragen (ohne SMS zu senden) und prüfen, zu welchem Konto er gehört.
2. **Antwort richtig auswerten:** seven.io-Rückgabecode lesen (100 = gesendet, alles andere = Fehler mit verständlichem Grund).
3. **Absender bereinigen:** ungültige Zeichen entfernen (z. B. „Kanzlei B&P“ → „KanzleiBP“), max. 11 Zeichen; Hinweis im Branding-Formular.
4. **Protokoll:** jede Konto-SMS mit Marke, Vic, Nummer, Ergebnis und Fehlergrund speichern; Fehlschläge in der Vic-Detailansicht und beim Lead-Import anzeigen.
5. Optional: Button „SMS erneut senden“ für betroffene Vics.

## Technische Details
- `create-user` (und `send-assignment-sms`, `forwardTan`): JSON-Antwort von gateway.seven.io parsen (`success`/Return-Code), `ok` nur bei 100.
- Neue Tabelle `sms_dispatch_log` (Admin-RLS, Schreiben nur service_role), Ergebnis zusätzlich in `console.log`.
- Absender-Sanitizer in `_shared` mit Test.
