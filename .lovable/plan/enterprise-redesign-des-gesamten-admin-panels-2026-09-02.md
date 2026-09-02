# Enterprise-Redesign des gesamten Admin-Panels

## Ziel
Das komplette `/admin` wird als seriöse, maßgeschneiderte Arbeitsoberfläche neu gestaltet. Gewählte Richtung: **Modern Professional Admin** mit **Institutional Navy**, **Sora/Manrope** und einem kompakten **Command Workspace**. Bestehende Funktionen, Daten und Abläufe bleiben unverändert.

## Visuelle Leitplanken
- Farbwelt: Navy `#0B1F3A`, Aktionsblau `#174EA6`, Weiß `#FFFFFF`, Arbeitsfläche `#F3F6FA`
- Typografie: **Sora** für Seitentitel und wichtige Kennzahlen, **Manrope** für Navigation, Tabellen, Formulare und Fließtext
- Keine Verläufe, Glasflächen, verspielten Icon-Kacheln oder übermäßig runden Elemente
- Präzise 1px-Trennlinien, kleine Radien, zurückhaltende Schatten und eine hohe, aber gut lesbare Informationsdichte
- Animationen nur als schnelle 120–160-ms-Hover-, Fokus- und Zustandswechsel

## Umsetzung
1. **Designsystem neu ordnen**
   - Semantische Tokens für Navy-Navigation, helle Arbeitsfläche, weiße Oberflächen, Border-, Fokus-, Status- und Schattenstufen definieren.
   - Globale Typografie auf Sora/Manrope umstellen und bestehende UI-Grundbausteine für konsistente Größen, Radien und Zustände abstimmen.

2. **Admin-Rahmen neu bauen**
   - Kompakte, dunkelblaue Sidebar mit klaren Gruppen, ruhigem Branding, eindeutiger aktiver Zeile und reduziertem Nutzerbereich.
   - Weißen Header mit klarer Seitenhierarchie und kontextbezogenen Aktionen aufbauen.
   - Responsive Navigation für kleinere Viewports beibehalten und professionell verdichten.

3. **Dashboard als Operations-Cockpit gestalten**
   - Kennzahlen als zusammenhängende, ruhige Informationsleiste statt bunter Einzelkacheln darstellen.
   - Schnellaktionen klar priorisieren.
   - Zuweisungen und SMS als hochwertige, breite Arbeits-Tabellen mit sauberer Spaltenrhythmik, Statusdarstellung und Hover-Zuständen gestalten.

4. **Alle Admin-Ansichten vereinheitlichen**
   - Leads, Vics, Verifikationen, Überprüfung, Dokumente, Telefonnummern, E-Mail-Vorlagen und Einstellungen auf dieselbe Seitenstruktur übertragen.
   - Seitentitel, Filter, Suche, Tabellen, Detailansichten, Leerzustände und Aktionsleisten konsistent gestalten.
   - Karten nur dort einsetzen, wo Inhalte wirklich gruppiert werden müssen; sonst klare, ungerahmte Bereiche und Tabellenflächen verwenden.

5. **Formulare und Dialoge professionalisieren**
   - Alle Admin-Popups mit ruhigem Header, eindeutigen Abschnitten, präzisen Labels, kompakten Feldern und fester Aktionsleiste neu gestalten.
   - Primär-, Sekundär-, Destruktiv- und Icon-Aktionen klar unterscheiden; keine dekorativen Badges oder unnötigen Effekte.
   - Suchfelder, Selects, Textareas, Uploads, Checkboxen und Validierungszustände optisch angleichen.

6. **Qualitätssicherung**
   - Alle Admin-Routen und zentralen Dialoge auf Desktop und Mobile prüfen.
   - Auf Überläufe, Textkollisionen, Tabellen-Scroll, Fokuszustände und konsistente Abstände kontrollieren.
   - Build sowie relevante bestehende Tests ausführen; Geschäftslogik und Datenzugriffe unangetastet lassen.

## Technische Details
- Schwerpunktdateien: globale Tokens/Typografie, Admin-Shell, gemeinsame shadcn/UI-Komponenten, DialogShell sowie sämtliche `Admin*`-Ansichten.
- Wiederkehrende Seitenköpfe, Tabellenrahmen und Toolbar-Muster werden als kleine gemeinsame Präsentationskomponenten zentralisiert.
- Das ausgewählte Referenz-Prototyping bestimmt Komposition und Dichte; Farben und Schrift werden auf die festgelegte Institutional-Navy-/Sora-Manrope-Richtung korrigiert.
