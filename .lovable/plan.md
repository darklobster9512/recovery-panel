## Vladan Todorovic: nur BBVA neu übertragen

Ist-Stand: Die Anfrage vom 05.11. (6 Banken) ist komplett fehlgeschlagen, weil das Panel „Sparda-Bank-videoident“ nicht kennt („Bank nicht gefunden“). Es wurde also keine Bank übertragen.

Schritte:
1. Die fehlgeschlagene Anfrage samt ihren 6 Bank-Einträgen löschen, damit BBVA nicht als „bereits angefragt“ gesperrt ist.
2. Eine neue Anfrage nur mit BBVA-Videoident über die normale Anfrage-Funktion ans Panel senden, mit denselben Personendaten (Name, Geburtsdaten, Adresse, Bank) wie vorher.
3. Prüfen, ob das Panel die Anfrage annimmt, und dir das Ergebnis melden.

Sonst wird nichts geändert. Commerzbank, Consorsbank, DKB, Santander und Sparda sind danach wieder frei für spätere Anfragen.

Hinweis: Sparda-Bank ist dem Panel offenbar unbekannt. Solange das so ist, schlägt jede Anfrage mit Sparda fehl.

### Technisch
- DELETE verification_request_items/verification_requests für id 6ccbafff-…
- Neue Anfrage über `request-verifications` (eingeloggte Admin-Session) mit den Feldern der alten Anfrage, `auftraege: ["BBVA-videoident"]`.
