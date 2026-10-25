# Dark Theme neu: "Old Money" (Zigarrenbar-Stil)

Ersetzt das bisherige dunkle Design. Umschalter in der Seitenleiste bleibt, heißt im Tooltip "Old Money".

## Stimmung
Warm, gedämpft, edel: dunkles Holz, Leder, Rauchgrau, Messing statt Blau.

## Farben
- Hintergrund: tiefes Espresso-Braun #14100D
- Kästen: dunkles Nussholz #1E1813, Felder/Hover #2A221B
- Ränder: feines Walnuss #3A2F25
- Text: Pergament/Creme #EDE4D3, Nebentext Rauchgrau #A39887
- Akzent: Messing/Cognac #B8894A (Knöpfe, aktiver Menüpunkt, Links, Zähler), Schrift darauf dunkel
- Seitenleiste: fast schwarzes Mahagoni #0E0B09 mit Messing-Markierung
- Status gedämpft: Olivgrün, Bernstein, Bordeaux statt kräftigem Grün/Gelb/Rot; Blau-Abzeichen werden Cognac

## Feinschliff
- Überschriften im Admin-Bereich im dunklen Modus in einer klassischen Serifenschrift (z.B. Cormorant/Playfair), Fließtext bleibt.
- Kästen mit dezenter Holz-Anmutung: leichter warmer Verlauf statt flach, feine Messing-Linie oben beim aktiven Element.
- Weiche, warme Schatten statt blauem Leuchten.
- Hell-Reste (weiße Flächen, Popups, Dropdowns, Diagramm-Gitter) an die Palette anpassen.

## Technisch
- `.dark`-Tokens in `index.css` neu (HSL), Schatten warm; Utility-Remaps für hardcodierte Farben (`bg-blue-*` → Cognac usw.).
- Serifenschrift per Google Fonts, nur unter `.dark` für `h1–h3`/`font-display`.
- Toggle-Beschriftung in `AdminPanel.tsx`; Memory "Design Theme" aktualisieren (dunkles Design = Old Money).
