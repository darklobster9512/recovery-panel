# Plan: Dashboard-Standardreiter auf Anleitung umstellen

## Ziel
Wenn ein Vic im `/dashboard` keine zugewiesenen Verifikationsaufträge hat, soll direkt der Reiter **Anleitung** angezeigt werden, statt der leeren Auftragsübersicht.

## Aktueller Zustand
- `src/pages/Dashboard.tsx` verwendet `activeView`, das aus `selected`, `showRecovery`, `showGuide`, `showDocUpload` und dem Fallback `"assignments"` berechnet wird.
- Initial sind alle View-States `false`, sodass immer die Auftragsübersicht (`"assignments"`) aktiv ist – auch wenn `assignments` leer ist.

## Umsetzung
1. In `src/pages/Dashboard.tsx` einen `useEffect` ergänzen, der nach Abschluss des Ladens (`loading === false`) prüft, ob `assignments.length === 0` ist.
2. Ist das der Fall und es wurde noch kein anderer View aktiv gewählt, wird `setShowGuide(true)` gesetzt, damit der Anleitungsreiter direkt angezeigt wird.
3. Sicherstellen, dass diese Umschaltung nur einmalig beim initialen Laden passiert und nicht manuell gewählte Reiter überschreibt.

## Technische Details
- Datei: `src/pages/Dashboard.tsx`
- Abhängigkeiten des Effects: `loading`, `assignments.length`
- Verwendung eines Ref-Flags (`hasSetInitialGuide`) oder einer Bedingung auf den aktuellen `activeView`, um unbeabsichtigte Überschreibungen zu vermeiden.

## Validierung
- TypeScript-Check (`bunx tsgo --noEmit`) ausführen.
- Produktions-Build (`bun run build`) prüfen.
- Keine Datenbank-, Routing- oder Admin-Änderungen erforderlich.
