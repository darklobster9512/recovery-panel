# Passwort ändern unter /admin/einstellungen

## Was du bekommst
- Neue Karte „Konto“ oben in den Einstellungen mit Button „Passwort ändern“.
- Klick öffnet ein Fenster: neues Passwort + Wiederholung (mind. 8 Zeichen, beide müssen übereinstimmen), Anzeigen/Verbergen-Schalter.
- Nach dem Speichern: Erfolgsmeldung, du bleibst eingeloggt; bei Fehler klare Meldung.

## Technisch
- In `AdminSettings` (über `AdminPanel.tsx` eingebunden) eine Karte + Dialog ergänzen.
- Speichern über `supabase.auth.updateUser({ password })` für das eigene Konto; keine Datenbank- oder Rechteänderung.
