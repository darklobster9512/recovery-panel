# Weiße Admin-Cards durch kühle Glasflächen ersetzen

## Ziel

Die rein weißen Cards im gesamten Admin-Panel werden optisch in die bestehende blau getönte Oberfläche integriert. Schrift, Inhalte, Größen und Layout bleiben unverändert. Die neue Farbwelt orientiert sich an der gewählten Richtung „Kühles Glas“ (`#F4F7FC`, `#E7EEF8`, Weiß und das bestehende Primärblau).

## Änderungen

- Die globalen Card- und Popover-Tokens erhalten eine kühle, sehr helle Blautönung statt Reinweiß.
- Eine einheitliche Admin-Card-Oberfläche kombiniert:
  - leicht transparente, blau getönte Fläche,
  - dezente Hintergrundunschärfe,
  - klare kühle Kontur,
  - kontrollierten mehrstufigen Schatten für erkennbare Tiefe.
- Der Seitenhintergrund wird ruhiger abgestimmt, damit Cards sichtbar bleiben, ohne erneut wie weiße Kästen zu wirken.
- Standard-Cards, Tabellencontainer, Statistiken, Dialoge, Dropdowns und Popover werden auf dieselbe Oberflächenhierarchie gebracht.
- Verschachtelte weiße Flächen werden entfernt oder auf eine zurückhaltende `muted`-Ebene gesetzt, damit keine „Card in Card“-Optik entsteht.
- Interaktive Zustände erhalten eine dezente blaue Tönung und stärkere Kontur bei Hover/Fokus; keine auffälligen Animationen.
- Bewusst weiße Inhaltsflächen wie die echte E-Mail-Vorschau im iframe bleiben weiß.

## Technische Details

- Zentrale Anpassung der semantischen Tokens in `src/index.css`, insbesondere `--card`, `--popover`, `--border`, `--muted`, `--gradient-surface`, `--shadow-card` und `--shadow-card-hover`.
- Die vorhandene `.card-glass`-Utility wird ohne `border-white` auf vollständig semantische Tokens umgestellt.
- Admin-Komponenten werden auf verbliebene feste Weiß-/Grau-Klassen geprüft und nur dort auf semantische Klassen umgestellt, wo sie echte App-Oberflächen darstellen.
- Bestehende Schriftfamilie, Typografie, Abstände, Navigation und Seitenstruktur bleiben unverändert.

## Prüfung

- Repräsentative Seiten wie Dashboard, Leads, Verifikationen, Einstellungen und E-Mail-Vorlagen auf konsistente Flächen prüfen.
- Dialoge, Dropdowns, Tabellen und Hover-/Fokuszustände auf Kontrast und Lesbarkeit prüfen.
- Desktop- und mobile Darstellung auf Überlagerungen und ungewollt weiße App-Flächen kontrollieren.
