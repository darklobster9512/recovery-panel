# Backup wieder zum Laufen bringen

## Ursache
Das stündliche Backup bricht seit der Umstellung auf "eine Datei" ab: Die Funktion lädt alle hochgeladenen Dateien (Ausweise, Dokumente) gleichzeitig in den Speicher und läuft in das Speicherlimit ("Memory limit exceeded" im Log). Deshalb kommt gar nichts mehr an.

## Lösung
- **Hauptdatei**: Eine ZIP mit allen Marken und allen Daten (alle Tabellen + Manifest) – wie gewünscht nur eine Datei pro Stunde für die Daten.
- **Hochgeladene Dateien** werden einzeln nacheinander geladen und in Teil-ZIPs bis ca. 45 MB gepackt; jeder Teil wird sofort an Telegram geschickt und aus dem Speicher entfernt. Kein Sammeln mehr im Speicher.
- **Nur neue Dateien**: Dateien, die schon in einem früheren Backup verschickt wurden, werden nicht jede Stunde erneut gesendet (Merker mit Datum des letzten erfolgreichen Datei-Backups). Einmal am Tag (z. B. 3 Uhr) kommt ein vollständiger Datei-Satz. Dadurch meist nur 1 Datei pro Stunde.
- Fehler werden weiterhin unter Einstellungen als "letzter Fehler" angezeigt.
- Danach Backup einmal von hier auslösen und prüfen, dass es in Telegram ankommt und keine Speicherfehler mehr im Log stehen.

## Technisch
- `admin-backup`: Datei-Download-Schleife streamend in Teil-ZIPs (`compression: STORE`), nach jedem `send` Referenzen freigeben; Tabellen-ZIP ohne Dateien.
- Inkrementell über `storage.objects.updated_at > backup_files_last_at` (neue Spalte in `app_settings`), Voll-Lauf täglich.
- Manifest listet pro Teil die Dateien; Import liest Hauptdatei + optionale Datei-Teile wie bisher.
