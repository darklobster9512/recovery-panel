# Plan: Identlink live auf WebID Redirect-Domain umschreiben

## Ziel
Im Zuweisen-Popup (`/admin/verifikationen`) soll der eingegebene Identlink sofort umgeschrieben werden, sobald der Toggle „WebID Redirect aktivieren" aktiviert ist:

- `https://webid-gateway.com/…` → `https://webid.korte-kanzlei.de/…`
- Auch Subdomains wie `www.webid-gateway.com` sollen erkannt werden.
- Der Identcode wird weiterhin aus den letzten 9 Ziffern des Links extrahiert.

## Umsetzung

1. **Helper-Funktion hinzufügen**
   In `src/components/AssignVerificationDialog.tsx` eine Funktion `rewriteWebidHost(url: string): string` ergänzen, die den Host-Anteil per Regex ersetzt:
   - Suchmuster: `^(https?://)(?:www\.)?webid-gateway\.de(/?.*)$`
   - Ersatz: `$1webid.korte-kanzlei.de$2`
   - Wenn der Link nicht auf `webid-gateway.com` passt, wird er unverändert zurückgegeben.

2. **Live-Umschreibung beim Tippen**
   Im `onChange`-Handler des `identlink`-Eingabefelds prüfen, ob `webidRedirect === true`.
   - Falls ja: Eingabe zuerst durch `rewriteWebidHost` laufen lassen, dann speichern.
   - Falls nein: Aktuelles Verhalten beibehalten.
   - Die Identcode-Extraktion erfolgt anschließend auf dem (ggf. umgeschriebenen) Wert.

3. **Bestehenden Wert umschreiben, wenn Toggle aktiviert wird**
   Ein `useEffect` auf `webidRedirect` ergänzen:
   - Wenn `webidRedirect` auf `true` wechselt und `fieldValues.identlink` vorhanden ist, den Wert sofort umschreiben.
   - Wenn der Toggle wieder deaktiviert wird, wird der Wert nicht zurückgesetzt (Nutzer kann ihn manuell korrigieren).

4. **Validierung**
   - `bunx tsgo --noEmit` ausführen.
   - Kurzer visueller Test im Preview: Link eingeben, Toggle aktivieren, Domain soll sofort wechseln und Identcode weiterhin erkannt werden.

## Dateien
- `src/components/AssignVerificationDialog.tsx`

## Keine Änderungen an
- Datenbank, RLS, Edge Functions, anderen Komponenten.
