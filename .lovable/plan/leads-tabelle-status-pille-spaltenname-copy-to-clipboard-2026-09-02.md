# Leads-Tabelle: Status-Pille, Spaltenname, Copy-to-Clipboard

## Änderungen in `src/components/AdminLeads.tsx`

1. **Status-Pille auf volle Spaltenbreite**
   - Der Select-Trigger nutzt `w-full` statt `w-[150px]`; die Badge darin wird auf `w-full justify-center` gesetzt, sodass die Pille immer exakt so breit ist wie die Status-Spalte.

2. **Dropdown-Optionen in Badge-Farben**
   - Jede Option im Dropdown rendert nicht nur Text, sondern eine Badge in der jeweiligen Statusfarbe (blau/amber/violett/rot/grün), ebenfalls über die volle Breite des Menüs.

3. **Spaltenüberschrift**
   - „Voller Name" → „Name".

4. **Klick auf Telefonnummer / Email kopiert in die Zwischenablage**
   - Beide Zellen werden zu klickbaren Elementen mit Hover-Hinweis und `title="Klicken zum Kopieren"`.
   - Kopieren über `navigator.clipboard.writeText`, danach eine kurze Toast-Bestätigung („Telefonnummer kopiert" / „Email kopiert").

## Nicht im Scope
- Keine Datenbank- oder Logikänderungen, nur Tabellendarstellung.
