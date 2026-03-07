

# Fix: Verlauf-Card gleiche Höhe wie SMS-senden-Card mit Scroll

## Problem
Die Verlauf-Card wächst mit der Anzahl der Einträge, statt auf die Höhe der SMS-senden-Card begrenzt zu bleiben.

## Ursache
Das Grid nutzt default `items-stretch`, aber die Verlauf-Card hat kein `overflow` constraint der greift — `flex-1 overflow-hidden` auf CardContent reicht nicht, weil die Card selbst keine feste/maximale Höhe hat und durch den Inhalt wächst.

## Lösung

**Datei:** `src/components/AdminSmsSpoof.tsx`

Einen **ref-basierten Ansatz** verwenden: Die Höhe der linken Card messen und auf die rechte Card als `max-height` anwenden.

1. `useRef` + `useEffect` + `ResizeObserver` auf die SMS-senden-Card, um deren Höhe zu messen
2. Die gemessene Höhe als `style={{ maxHeight }}` auf die Verlauf-Card setzen
3. Die Verlauf-Card behält `flex flex-col overflow-hidden`, CardContent behält `flex-1 overflow-hidden`, Table-Wrapper behält `h-full overflow-auto`

So ist die Verlauf-Card **immer exakt gleich hoch** wie die SMS-senden-Card, egal wie viele Einträge drin sind, und man kann bei Überlauf scrollen.

