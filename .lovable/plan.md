# Identcode automatisch aus Identlink ableiten

Im Zuweisen-Popup (`/admin/verifikationen` → „Zuweisen") wird die Reihenfolge der Felder geändert und der Identcode automatisch aus dem eingegebenen Identlink extrahiert.

## Änderungen

1. **Reihenfolge**: Identlink-Feld wird über dem Identcode-Feld angezeigt (aktuell umgekehrt, weil `required_fields` = `['identcode','identlink',...]`).
2. **Auto-Extraktion**: Sobald ein Identlink eingegeben oder eingefügt wird, werden live die letzten 9 Ziffern der URL als Identcode gesetzt.
   - Beispiel: `https://webid.-gateway.de/service/qa/cn/000347/aid/694977088` → Identcode `694977088`.
   - Regex: letzte zusammenhängende 9-stellige Zahl im String.
   - Wenn der Link keine passende Zahl enthält, bleibt der Identcode leer (nicht überschreiben).
3. **Identcode-Feld** bleibt manuell editierbar (falls der Nutzer korrigieren will) — die Auto-Befüllung greift nur beim Ändern des Identlinks.

## Technisch

- Datei: `src/components/AssignVerificationDialog.tsx`.
- Beim Rendern der Felder `identlink` zuerst rendern, dann `identcode`, restliche Felder danach (unabhängig von der Reihenfolge in `required_fields`).
- `onChange` des Identlink-Inputs: `setFieldValues` setzt sowohl `identlink` als auch `identcode` (aus Regex-Match) in einem Update.
- Keine Datenbank-Änderungen, keine Änderungen an anderen Screens.
