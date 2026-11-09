# Stündliches Backup: nur noch eine Datei

## Was heute passiert
Jede Stunde schickt das Backup mehrere Dateien an Telegram:
1. ein Komplett-Backup aller Marken,
2. zusätzlich je Marke ein eigenes Backup (Korte, Berthold, ...) – doppelt, weil diese Daten schon im Komplett-Backup stecken,
3. die hochgeladenen Dateien (Ausweise, Dokumente) als weitere ZIP-Teile.

## Was sich ändert
- Jede Stunde kommt **genau eine ZIP-Datei** mit allen Marken, allen Daten und allen hochgeladenen Dateien.
- Die einzelnen Marken-Backups fallen weg.
- Die Nachricht dazu zeigt Uhrzeit, Anzahl Einträge, Anzahl Dateien und die Einträge je Marke.
- Das Wiederherstellen unter Einstellungen funktioniert weiter mit dieser einen Datei (auch nur für eine Marke).

## Einschränkung
Telegram nimmt höchstens ca. 50 MB pro Datei. Nur wenn das Backup größer wird, kommen die restlichen hochgeladenen Dateien als zusätzlicher Teil hinterher – sonst immer nur eine Datei.

## Technisch
- `admin-backup`, Aktion `telegram`: Schleife über `brandList` (Marken-ZIPs) entfernen; Daten + `files/<bucket>/<name>` in ein einziges ZIP (`backup-<stamp>.zip`); `manifest.json` mit `files`-Liste und `profiles_per_brand`.
- Dateien, die das 45-MB-Limit sprengen würden, als Überlauf-Teil senden.
- Prüfen, dass der Import in den Einstellungen Dateien aus dem Daten-ZIP liest; falls nicht, anpassen.
- Funktion neu deployen und einmal manuell auslösen.
