# Auth-Seite: Logo-Font und Kooperations-Logos korrigieren

## Ziel
Kleinere optische Korrekturen an der überarbeiteten `/auth`-Seite, damit sie exakt zum Dashboard passen.

## Änderungen

1. **Kanzlei-Logo-Font angleichen**
   - In `src/pages/Auth.tsx` den Wordmark-Block so gestalten wie in `src/pages/Dashboard.tsx`:
     - `font-serif text-xl tracking-tight text-[#0b1f3a]`
     - Goldener Ampersand via `text-[#c9a24a]`
     - Unterzeile: `Rechtsanwaltskanzlei` in `text-[11px] uppercase tracking-widest text-slate-500`
   - Aktuell verwendet Auth noch `text-2xl font-bold` und `Rechtsanwälte`.

2. **Kooperations-Logos untereinander**
   - Den Block „In Kooperation mit" von horizontaler Anordnung auf vertikale Spalte ändern.
   - IOSCO oben, Europol darunter.
   - Beide Logos zentriert ausrichten.

## Technische Details
- Betroffene Datei: `src/pages/Auth.tsx`.
- Keine neuen Abhängigkeiten.
- Keine Backend-Änderungen.
