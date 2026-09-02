# Sidebar-Blau an /auth angleichen

## Problem
Die /auth-Seite nutzt auf der rechten Hero-Seite einen Blau-Verlauf
`from hsl(221,100%,50%) → to hsl(221,100%,35%)` (siehe `src/pages/Auth.tsx:166`).
Die Admin-Sidebar ist dagegen ein flaches `hsl(221 100% 50%)` (Token
`--sidebar-background` in `src/index.css:40`). Dadurch wirkt sie heller/knalliger
als der Auth-Hero, obwohl beide „blau“ sind.

## Änderung
1. `src/index.css`
   - `--sidebar-background` bleibt als Basis-Token `221 100% 42%` (Mittelwert des
     Auth-Verlaufs), damit alle `bg-sidebar`-Fallbacks passen.
   - `--sidebar-border` auf `221 100% 30%` (dunklere Kante wie Auth-Verlaufsende).
   - `--sidebar-accent` auf `221 100% 30%` (aktiver/hover Zustand, satter Ton).
2. `src/components/ui/sidebar.tsx` bleibt unverändert — nur Tokens werden
   angepasst, damit die restliche Sidebar-Struktur (weiße Akzente, Chips)
   erhalten bleibt.
3. Optional (empfohlen): dem `<Sidebar>`-Wrapper in `src/pages/AdminPanel.tsx`
   eine Zusatzklasse geben, die exakt denselben Verlauf wie der Auth-Hero rendert:
   `bg-gradient-to-b from-[hsl(221,100%,50%)] to-[hsl(221,100%,35%)]`. Damit ist
   die Sidebar 1:1 der Auth-Hero-Blauton, nicht nur „ähnlich“.

## Nicht angefasst
- Weiße Cards, weißer Header, blaue Buttons, Inputs — bleiben unverändert.
- Auth-Seite bleibt unverändert.

## Frage
Soll die Sidebar den **identischen Verlauf** wie der Auth-Hero bekommen
(Variante 3, empfohlen), oder eine **flache Farbe** in einem der beiden
Auth-Töne (50% oder 35%)?
