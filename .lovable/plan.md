# Plan: Telefonnummern-Zugriff für Caller korrigieren

## Bestätigte Ursache
Die Telefonnummern selbst werden für Caller bereits aus der Datenbank geladen. Der Fehler entsteht anschließend in der Anosim-Funktion: Sie erlaubt vollständige Nummernabfragen aktuell nur Admins. Nicht-Admins werden dort wie Vics behandelt und müssen eine eigene Verifikationszuweisung zur jeweiligen Nummer besitzen. Ein Caller hat diese persönliche Zuweisung nicht und erhält deshalb bei jeder Nummer `403 Forbidden`.

## Umsetzung

1. **Anosim-Funktion für Caller freigeben**
   - Neben der Admin-Rolle auch die Caller-Rolle serverseitig über die bestehende Rollenprüfung feststellen.
   - Caller dürfen die Daten aller Telefonnummern abrufen, die in der internen Telefonnummernliste gespeichert sind.
   - Die bestehende Einschränkung für Vics bleibt unverändert: Sie dürfen weiterhin nur Nummern aus ihren eigenen Aufträgen abrufen.
   - Unbekannte oder nicht gespeicherte Tokens werden auch für Caller abgelehnt.

2. **Telefonnummern-Seite rollenrichtig darstellen**
   - Caller erhalten eine reine Leseansicht mit Nummer, Status, Laufzeit und eingegangenen SMS.
   - „Verbindung hinzufügen“ und Löschen bleiben ausschließlich Admins vorbehalten und werden für Caller ausgeblendet.
   - Bestehende automatische Aktualisierung der Nummerndaten bleibt erhalten.

3. **Weitere betroffene Ansichten absichern**
   - Die gleiche Caller-Freigabe der Anosim-Funktion behebt die 403-Fehler bei Telefonnummern, Verifikationszuweisung, Überprüfung und Vic-Details, soweit diese dieselbe Funktion verwenden.

4. **Prüfung**
   - Mit dem Caller-Zugriff prüfen, dass alle gespeicherten Telefonnummern samt Anosim-Daten ohne 403 angezeigt werden.
   - Prüfen, dass Caller keine Nummer hinzufügen oder löschen können.
   - Prüfen, dass Admins weiterhin lesen, hinzufügen und löschen können und Vics keinen erweiterten Zugriff erhalten.

## Technische Details
Die Datenbank-Policy zum Lesen aller Telefonnummern für Caller existiert bereits. Erforderlich sind eine rollenbasierte Autorisierung in `anosim-proxy` und die rollenabhängige Anzeige der Verwaltungsaktionen in der Telefonnummern-Seite; eine Datenbankmigration ist nicht nötig.
