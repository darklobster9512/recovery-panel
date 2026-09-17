# Leads-Import (Kanzlei) aus der Liste

## Was passiert

Die gesendete Liste wird als Kanzlei-Leads in die Lead-Verwaltung eingefügt — direkt per Datenbank-Import, du musst nichts hochladen.

- Kampagne: **Kanzlei** für alle
- Status: **Neu**
- Quelle: `manuell`
- Importzeitpunkt: das jeweilige Datum aus der Liste (nicht "heute"), damit die Historie stimmt

## Feldzuordnung

| Feld in der Liste | Feld im Lead |
|---|---|
| Name | Voller Name (doppelte Nachnamen wie "Elke Hahn Hahn" werden bereinigt) |
| E-Mail | Email |
| Nummer | Telefonnummer (mit `+` vorangestellt) |
| ungefährer Verlustbetrag | Schadenshöhe |
| wie genau sind Sie an Ihr Geld gekommen | Was ist vorgefallen |

Zusatzangaben wie Rückrufzeit ("10:00 - 13:00") und Land werden mitgespeichert und sind in der Detailansicht unter den Rohdaten sichtbar.

## Beträge

- Klare Zahlen werden als Betrag übernommen (z. B. `94.000,-€` → 94000, `251,89€` → 251,89, `81691,66 Euro` → 81691,66).
- Ungenaue Angaben ohne Zahl (z. B. „über 15.000 €", „anderer Betrag", „5000 - 20 000€", „mehrere 100.000", „mehr als 1.000€") bleiben beim Betrag leer; der Originaltext wird im Vorfall-Feld mit ergänzt, damit nichts verloren geht.

## Duplikate

Die Liste enthält viele Einträge doppelt (Block wird zweimal wiederholt) — es wird jeweils nur einer importiert. Zusätzlich sind drei Personen bereits in der Datenbank vorhanden und werden übersprungen:

- Roland Hempel (rolandhempel7@gmail.com)
- Fred Günther Stemmer (plattfuss555@freenet.de)
- Peter Rappenglück (peter.rappenglueck62@gmail.com)

Ergebnis: **38 neue Leads**, 3 übersprungen.

## Nicht enthalten

- Keine Änderungen an Code, Tabellen oder Berechtigungen
- Keine E-Mails, keine Zuweisung an Caller
