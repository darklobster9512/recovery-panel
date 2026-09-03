# Dashboard Sidebar: sticky & viewport-hoch

## Ziel
Die Desktop-Sidebar im `/dashboard` soll nicht länger als der Content wachsen, sondern exakt die Viewport-Höhe einnehmen (abzüglich des gleichen Abstands oben und unten) und beim Scrollen der Seite sticky mitlaufen.

## Aktueller Stand
- `src/pages/Dashboard.tsx` hat nach der letzten Änderung:
  - äußeren Wrapper mit `flex flex-col`
  - Content-Spalte mit `h-full overflow-y-auto`
  - Sidebar-Spalte mit `h-full`
- Dadurch scrollt der Content unabhängig von der Sidebar, was nicht gewünscht ist.

## Änderungen
1. Äußeren Wrapper zurücksetzen: `min-h-screen bg-muted/30` (kein Flex).
2. Container zurücksetzen: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8` (kein `flex-1`).
3. Grid zurücksetzen: `lg:grid lg:grid-cols-4 lg:gap-8` (kein `flex-1`).
4. Desktop-Aside zurücksetzen: `hidden lg:block lg:col-span-1`.
5. Sidebar-Card auf sticky & Viewport-Höhe setzen:
   - `sticky top-8`
   - `h-[calc(100vh-4rem)]`
   - `flex flex-col overflow-y-auto`
   - `rounded-xl border border-border bg-card shadow-sm p-6`
6. Content-Spalte zurücksetzen: `lg:col-span-3 min-w-0` (kein `h-full overflow-y-auto`).

## Warum `calc(100vh-4rem)`?
- `py-6 lg:py-8` ergibt oben und unten jeweils `2rem` Abstand (`lg` Breakpoint).
- `top-8` hält die Sidebar am oberen Rand dieses Abstands.
- `100vh - 4rem` lässt unten denselben `2rem`-Abstand zum Viewport-Rand.

## Dateien
- `src/pages/Dashboard.tsx`

## Keine Backend-/API-/Datenbank-Änderungen

## Verifikation
- `bunx tsc --noEmit`
- `bun run build`
- Visueller Check im Preview: Sidebar bleibt sichtbar, wenn der Content länger als der Viewport ist.
