# Kein Flackern bei „Angeforderte Verifikationen“ und „Bereit zum Start“

Beim Öffnen der Seite tauchen Anfragen kurz unter „Angeforderte Verifikationen“ auf und springen dann zu „Bereit zum Start“ oder verschwinden ganz. Das kommt daher, dass die beiden Bereiche getrennt laden.

- Beide Bereiche bleiben unsichtbar, bis alle Informationen da sind. Dann erscheinen sie einmal in ihrer endgültigen Form. Der Erklärkasten mit dem Knopf „Verifikation anfragen“ steht sofort da.
- Auch „Bereit zum Start“ zeigt sich erst, wenn bekannt ist, welche Karten ausgeblendet sind und welcher Auftrag welchen Status hat.

## Technisch
- `PreparedVerificationCards`: neues Flag `loaded`, das nach dem ersten vollständigen `load()` gesetzt wird (Einträge, Zuweisungsstatus, ausgeblendete Anfragen). Ein neuer Callback `onLoaded` meldet das an die übergeordnete Komponente. Vorher gibt die Komponente `null` zurück. Die Daten werden erst gemeinsam am Ende von `load()` gesetzt.
- `RequestVerificationsSection`: `rowsLoaded` nach dem ersten `load()` setzen. Die Liste „Angeforderte Verifikationen“ erst anzeigen, wenn `rowsLoaded` und `preparedLoaded` beide wahr sind.
