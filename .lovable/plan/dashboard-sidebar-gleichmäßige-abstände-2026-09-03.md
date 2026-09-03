# Dashboard-Sidebar: Gleichmäßige Abstände

## Ziel
Die im letzten Redesign eingeführte Dashboard-Sidebar-Card soll vertikal das volle Viewport-Höhe ausnutzen, aber oben und unten denselben Abstand zum Seitenrand behalten, den sie aktuell nur oben hat.

## Änderungen

### 1. `src/pages/Dashboard.tsx`
- Sidebar-Container von `h-auto` bzw. aktueller Höhe auf `h-screen`/`min-h-screen` mit gleichem Top-/Bottom-Padding umstellen.
- Sidebar-Card (`aside`) bekommt `h-full` und ein vertikales Flex-Layout, sodass sie sich über die volle verfügbare Höhe erstreckt.
- Padding des äußeren Dashboard-Containers anpassen: z. B. `p-6` oder `p-8` bleibt gleich oben und unten, damit die Card symmetrisch sitzt.
- Inhalt (`main`) rechts daneben ebenfalls `h-full`/`overflow-y-auto`, damit das Scrollverhalten erhalten bleibt.

### 2. Visuelle Kontrolle
- Keine neuen Daten oder API-Änderungen.
- Nach der Anpassung Typecheck und Build laufen lassen.
- Visuell prüfen, dass Sidebar-Card oben, unten, links gleichmäßig absteht und der Content rechts sauber ausgerichtet ist.
