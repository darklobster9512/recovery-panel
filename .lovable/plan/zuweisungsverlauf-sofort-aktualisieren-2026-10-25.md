# Zuweisungsverlauf sofort aktualisieren

Der normale „Zuweisen“-Dialog aktualisiert den Verlauf schon. Beim „Starten“ unter „Bereit zum Start“ (und bei „Vic abgesprungen“) passiert das noch nicht, weil die Rückmeldung nicht bis zum Verlauf weitergereicht wird.

- Nach „Starten“ erscheint die neue Zuweisung sofort im Zuweisungsverlauf, ohne dass man die Seite neu laden muss.
- Beim Neuladen bleibt die bisherige Tabelle sichtbar, damit nichts flackert.

## Technisch
- `RequestVerificationsSection` bekommt die Eigenschaft `onAssigned` und reicht sie an `PreparedVerificationCards` (`onChanged`) weiter.
- `AdminVerifications.tsx`: `<RequestVerificationsSection onAssigned={() => setHistoryRefreshToken(n => n + 1)} />`.
- `AdminAssignmentHistory`: den Ladezustand nur beim ersten Laden zeigen, nicht bei späteren Aktualisierungen.
