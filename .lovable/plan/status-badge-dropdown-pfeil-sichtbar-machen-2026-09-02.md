# Status-Badge: Dropdown-Pfeil sichtbar machen

## Problem
In der Leads-Tabelle ist der Status-Badge als Select-Trigger umgesetzt, aber der Dropdown-Pfeil ist mit `[&>svg]:hidden` ausgeblendet. Dadurch ist nicht erkennbar, dass die Status-Pille klickbar/interaktiv ist.

## Lösung
In `src/components/AdminLeads.tsx` den Status-SelectTrigger anpassen:

1. `[&>svg]:hidden` entfernen, damit der native Dropdown-Pfeil des Select-Triggers wieder sichtbar ist.
2. Sicherstellen, dass Badge und Pfeil harmonisch nebeneinander passen:
   - Badge auf `w-full` / `flex-1` belassen und Text zentriert halten.
   - Pfeil-Icon sollte rechts am Trigger stehen und nicht umbrechen.
3. Optional: Dem Trigger einen leichten Hover-Zustand geben (z. B. `hover:bg-gray-50` oder `cursor-pointer`), damit die Interaktivität visuell verstärkt wird.
4. Dropdown-Optionen in Badge-Farben bleiben unverändert.

## Dateien, die geändert werden
- `src/components/AdminLeads.tsx`

## Nicht im Scope
- Keine Datenbank- oder Logikänderungen.
- Keine Änderungen an anderen Admin-Reitern.
