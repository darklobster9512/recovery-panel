# Backup-Chat: Fehler „chat not found" beheben

## Ursache (bei Telegram direkt geprüft)
- Eingetragene Chat-ID `-5530270232`: Telegram sagt dem Bot **@recovery0209bot** „chat not found" – der Bot sieht diese Gruppe nicht. Das ist eine Antwort von Telegram, nicht vom Code.
- Mögliche Gründe: In der Gruppe ist ein anderer Bot als @recovery0209bot, oder die ID ist veraltet/falsch (z. B. wurde die Gruppe zur Supergruppe umgewandelt; dann beginnt die neue ID mit `-100…`).
- Gegenprobe: Die Gruppe „Recovery Aktivitäten" (`-1004290827615`) wird vom selben Bot problemlos gefunden.

## Lösung
1. Prüfen, dass **@recovery0209bot** (genau dieser) Mitglied der Backup-Gruppe ist. Am einfachsten: ihn entfernen und neu hinzufügen.
2. Danach kurz eine Nachricht in die Gruppe schreiben.
3. In den Backups noch einen Knopf **„Chat-ID ermitteln"** einbauen: Er liest die letzten Gruppen ab, in denen der Bot ist, und zeigt sie mit Namen und richtiger ID zur Auswahl. Dann muss die ID nicht mehr per Hand kopiert werden.
4. Außerdem gibt es eine verständliche Fehlermeldung auf Deutsch („Bot ist nicht in dieser Gruppe oder die ID ist falsch – @recovery0209bot hinzufügen").

## Technische Details
- `admin-backup` erhält die neue Aktion `find_chats` (nur Admin). Sie ruft `getUpdates` auf und, falls ein Webhook aktiv ist, als Ausweichweg `getChat` für die bekannten Chats aus `telegram_chats`. Ausgegeben werden nur eindeutige Gruppen/Supergruppen.
- Bei „chat not found" gibt Telegram eine Antwort mit `migrate_to_chat_id` zurück. Ist diese vorhanden, wird die neue ID automatisch übernommen.
- In der Oberfläche kommen neben dem Feld für die Chat-ID ein Auswahlmenü und der Knopf zum Ermitteln dazu.
