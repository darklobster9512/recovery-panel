

# Fix: Verlauf-Card Scrolling und gleiche Höhe

## Problem
- Die Verlauf-Card ist abgeschnitten und man kann nicht scrollen
- Die beiden Cards sind nicht gleich hoch

## Ursache
- `items-start` auf dem Grid verhindert gleiche Höhe
- `overflow-hidden` auf der Card + `max-h-[420px]` schneidet den Inhalt ab, aber der innere Scroll-Container funktioniert nicht korrekt weil die Table-Komponente selbst einen `overflow-auto` Wrapper hat (in `table.tsx` Zeile 7)

## Lösung in `AdminSmsSpoof.tsx`

1. Grid: `items-start` entfernen → zurück zu default `items-stretch` damit beide Cards gleich hoch sind
2. Verlauf-Card: `max-h-[420px]` entfernen (Höhe wird durch die linke Card bestimmt), `flex flex-col overflow-hidden` beibehalten
3. CardContent: `flex-1 overflow-hidden` beibehalten  
4. Table-Wrapper (`div` um `<Table>`): `h-full overflow-auto` beibehalten — das Problem ist dass die `Table`-Komponente selbst nochmal einen `overflow-auto` div wrapper hat. Lösung: Die Table direkt ohne den äußeren div rendern, oder den äußeren Wrapper als den Scroll-Container nutzen und die Table-Komponente's eigenen Wrapper überschreiben

Konkret: Den `<div className="h-full overflow-auto">` beibehalten aber der `<Table>` Komponente eine `className` geben die den inneren wrapper override. Einfacher: Statt `<Table>` direkt `<table>` verwenden innerhalb des scroll-containers, oder den wrapper div entfernen und stattdessen dem Table eine custom className geben.

**Einfachste Lösung:**
- Grid: `items-start` → entfernen (default stretch)
- Card: `max-h-[420px]` entfernen, `flex flex-col` und `overflow-hidden` beibehalten
- Der äußere `<div className="h-full overflow-auto">` wird der Scroll-Container
- Problem: Table-Komponente erzeugt `<div class="relative w-full overflow-auto"><table>...</table></div>` — das ist ein zweiter Scroll-Container. Lösung: Diesen inneren div brauchen wir nicht. Statt `<Table>` nutzen wir direkt `<table className="w-full caption-bottom text-sm">` damit es nur einen Scroll-Container gibt.

**Datei:** `src/components/AdminSmsSpoof.tsx`
- Zeile 231: `items-start` entfernen
- Zeile 258: `max-h-[420px]` entfernen
- Zeile 274: `<Table>` → `<table className="w-full caption-bottom text-sm">` und `</Table>` → `</table>` (um doppelten overflow-wrapper zu vermeiden)

