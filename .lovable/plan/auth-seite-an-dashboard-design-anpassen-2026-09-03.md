# /auth Seite an Dashboard-Design anpassen

## Ziel
Die Auth-Seite (`/auth`) optisch an das aktuelle Dashboard-Design (Navy/Gold/Weiß) angleichen und das RecoveryPanel-Branding durch das Kanzlei-Branding ersetzen.

## Änderungen

1. **Farben anpassen**
   - Hintergrund: `slate-50` oder weiß statt aktuellem Blau-Gradient.
   - Primärfarbe: Navy `#0b1f3a` für Titel, Labels, Buttons, Fokus-Ringe.
   - Akzentfarbe: Gold `#c9a24a` für Ampersand im Logo und dekorative Elemente.
   - Eingabefelder: weiß mit `slate-200` Border, `slate-700` Text.

2. **Branding ersetzen**
   - Shield-Icon und „RecoveryPanel“-Text entfernen.
   - Stattdessen Kanzlei-Wordmark „Korte <span className="text-[#c9a24a]">&amp;</span> Partner" oben im Formularbereich einbauen.

3. **Kooperations-Logos in linker Hälfte**
   - Unterhalb des Formulars, im linken Bereich, einen Block „In Kooperation mit" hinzufügen.
   - Europol- und IOSCO-Logos mittig/horizontal anzeigen (verwendet dieselben Assets wie Dashboard).

4. **Rechte Hälfte (nur Desktop)**
   - Optional: Gradienten anpassen oder beibehalten, aber in Navy/Gold-Palette, falls sichtbar.
   - Keine inhaltlichen Änderungen an Texten/Animationen.

5. **Funktionalität**
   - Login-/Register-Formular, Fehlerübersetzung und Weiterleitungen bleiben unverändert.

## Technische Details
- Betroffene Datei: `src/pages/Auth.tsx`.
- Keine neuen Abhängigkeiten.
- Keine Backend-Änderungen.
