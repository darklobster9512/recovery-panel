# Plan: WebID-Gateway-Host für .de und .com umschreiben

## Ziel
Die Live-Umschreibung im Zuweisen-Popup soll sowohl `webid-gateway.de` als auch `webid-gateway.com` (inkl. Subdomain `www.`) auf `webid.korte-kanzlei.de` umschreiben.

## Umsetzung

1. **Regex erweitern**
   In `src/components/AssignVerificationDialog.tsx` die Helper-Funktion `rewriteWebidHost` anpassen:
   - Altes Muster: `webid-gateway\.de`
   - Neues Muster: `webid-gateway\.(?:de|com)`
   - Beispiel: `https://webid-gateway.de/service/qa/cn/000347/aid/695906587` → `https://webid.korte-kanzlei.de/service/qa/cn/000347/aid/695906587`

2. **Validierung**
   - `bunx tsgo --noEmit` ausführen.
   - Kurzer manueller Test im Preview mit beiden Domains.

## Dateien
- `src/components/AssignVerificationDialog.tsx`
