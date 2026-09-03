# Zurück-Button in der Auftrags-Detailansicht (/dashboard)

## Ziel
Wenn ein Vic in `/dashboard` einen Auftrag angeklickt hat und sich in der Detailansicht befindet, soll oben ein "Zurück zu den Aufträgen"-Button angezeigt werden. Ein Klick führt zurück zur Auftragsübersicht.

## Umsetzung

1. **Dashboard-Detailansicht erweitern**
   - Datei: `src/pages/Dashboard.tsx`
   - In der Detailansicht (Bereich, in dem `selected` gerendert wird) oberhalb des Auftrags-Titels einen Zurück-Button einfügen.
   - Der Button setzt `selectedId(null)`, wodurch `activeView` automatisch wieder `"assignments"` wird.

2. **Design**
   - Button im Dashboard-Farbschema (Navy `#0b1f3a`, ggf. Gold-Akzent `#c9a24a`)
   - Icon `ArrowLeft` aus `lucide-react`
   - Text: "Zurück zu den Aufträgen"
   - Deutlich sichtbar, aber dezenter als Primary-CTA (z. B. `variant="ghost"` oder `outline`)

3. **Verifikation**
   - `bunx tsgo --noEmit` ausführen
   - `bun run build` ausführen
   - Visuell im Preview prüfen, ob der Button korrekt oberhalb der Auftragsdetails angezeigt wird und die Navigation funktioniert
