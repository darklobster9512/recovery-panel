# Plan: Identlink-Umschreibung direkt im Toggle-Handler ausführen

## Ziel
Wenn der Nutzer im Zuweisen-Popup den Haken „WebID Redirect aktivieren" setzt, soll der bereits eingegebene Identlink sofort umgeschrieben werden – ohne Verzögerung durch einen `useEffect`.

## Umsetzung

1. **Rewrite aus useEffect entfernen**
   Den `useEffect` auf `webidRedirect` in `src/components/AssignVerificationDialog.tsx` entfernen, da er nicht zuverlässig genug greift.

2. **Rewrite direkt im Checkbox-Handler**
   Im `onChange` der WebID-Redirect-Checkbox folgendes tun:
   - `setWebidRedirect(checked)` setzen.
   - Falls `checked === true` und `fieldValues.identlink` vorhanden ist, den Wert sofort durch `rewriteWebidHost` laufen lassen und in `fieldValues` speichern.
   - Falls `checked === false`, nur den Toggle-State ändern (kein Zurückschreiben).

3. **Live-Umschreibung beim Tippen beibehalten**
   Der bestehende `onChange`-Handler des `identlink`-Inputs bleibt unverändert: solange der Haken gesetzt ist, wird jede Eingabe live umgeschrieben.

4. **Validierung**
   - `bunx tsgo --noEmit` ausführen.
   - Kurzer visueller Test: Link eingeben, Haken setzen, Domain soll sofort wechseln.

## Dateien
- `src/components/AssignVerificationDialog.tsx`
