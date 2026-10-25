# Dark Theme neu: Neutral Graphit mit blauen Akzenten

## Farben
- Hintergrund #0E0F12 (fast schwarz, neutral, kein Blaustich)
- Kästen #16181D, Hover/Felder #22252C, Ränder fein #26292F
- Text #ECEEF2, Nebentext neutrales Grau #8B9099
- Akzent Blau #2F7BFF für Knöpfe, aktiven Menüpunkt, Links, Zähler
- Seitenleiste #0B0C0F (eine Stufe dunkler als Inhalt), aktiver Punkt blau

## Feinschliff
- Kästen ohne schweren Schatten, dafür klare 1-px-Ränder (Stil Linear/Vercel).
- Tabellen-Kopf, Eingaben und Reiter in #22252C statt bläulich.
- Status-Abzeichen (grün/gelb/rot/blau) als dezente transparente Flächen mit hellerer Schrift.
- Hell-Reste prüfen: weiße Flächen, helle Hintergründe in Diagrammen, Tooltips, Dropdowns, Popups, Login-Branding-Kasten in der Seitenleiste.
- Diagramm-Gitterlinien und -Beschriftungen an das Grau angepasst.

## Technisch
- `.dark`-Tokens in `index.css` komplett neu (HSL), Schatten-Tokens flach.
- Utility-Remaps für hardcodierte Farben an neue Palette angleichen, fehlende ergänzen (`bg-white/…`, `text-slate-400/300`, Recharts-Gitter).
- Danach per Screenshot prüfen (Login-Seite bleibt hell; Admin ohne Anmeldung nur eingeschränkt prüfbar).
