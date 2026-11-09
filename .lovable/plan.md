# Backup wieder zum Laufen bringen

## Ursache
Das stündliche Backup bricht seit der Umstellung auf "eine Datei" ab: Die Funktion lädt alle hochgeladenen Dateien, vor allem die Ausweise und Vic-Dokumente, gleichzeitig in den Speicher und überschreitet das Speicherlimit ("Memory limit exceeded" im Log). Darum kommt gar nichts mehr an.

## Lösung
- **Ausweise und Vic-Dokumente kommen nicht mehr ins Backup** (der ganze Dokumente-Ordner wird übersprungen). Die Einträge dazu bleiben in den Daten, nur die Bilddateien selbst fehlen.
- Kleine Dateien wie Caller-Profilbilder, Livechat-Anhänge und Bilder aus der Anweisung bleiben drin. Sie werden einzeln nacheinander geladen statt alle auf einmal.
- Pro Stunde kommt **genau eine ZIP-Datei** mit allen Marken und allen Daten.
- Fehler stehen weiter unter Einstellungen als "letzter Fehler".
- Danach löse ich ein Backup aus und prüfe im Log, dass es durchläuft und an Telegram geht.

## Technisch
- `admin-backup`: Bucket `user-documents` bei `listFiles` ausschließen (Regel in `_shared/backupScope.ts`, Test in `src/test/backupScope.test.ts`).
- Kein `pending`-Sammeln und keine Zusatz-Teile mehr; Dateien sequentiell laden, Größenlimit 45 MB einhalten (überzählige Dateien überspringen und in der Nachricht melden).
- Import bleibt kompatibel (Manifest listet enthaltene Dateien).
