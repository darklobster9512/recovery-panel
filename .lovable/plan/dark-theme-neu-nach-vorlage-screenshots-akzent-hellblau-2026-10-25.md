# Dark Theme neu nach Vorlage (Screenshots), Akzent Hellblau

Ersetzt "Old Money". Umschalter bleibt (Tooltip wieder "Dunkles Design"), helles Design unverändert.

## Look laut Vorlage
- Hintergrund fast reines Schwarz #0A0A0A, Seitenleiste und Kopfzeile ebenfalls schwarz, getrennt nur durch feine Linie #1F1F1F.
- Kästen #111111 mit sehr feinem Rand #1F1F1F und einem kaum sichtbaren hellblauen Schimmer oben (wie der grüne Schimmer in der Vorlage).
- Text weiß #F5F5F5, Nebentext neutralgrau #8A8A8A; Gruppenüberschriften der Seitenleiste klein, grau, Großbuchstaben.
- Aktiver Menüpunkt: dezente graue Pille #1A1A1A mit weißer, fetter Schrift (nicht mehr kräftig blau gefüllt), Symbol weiß.
- Akzent Hellblau #38BDF8: Hauptknöpfe (gefüllt, dunkle Schrift), Icons in Kennzahl-Kacheln (runder dunkler Kreis mit blauem Symbol), Links, Trend-Texte, Zähler.
- Nebenknöpfe: schwarz mit feinem Rand, weiße Schrift.
- Abzeichen als umrandete Pillen mit transparentem Farbton: Aktiv grün, Inaktiv rot, Info hellblau, neutral grau, genau wie in der Vorlage.
- Reiter (Tabs): dunkle Leiste, aktiver Reiter etwas heller mit weißer Schrift.
- Eingaben/Tabellenkopf #141414, Zeilen-Hover #161616.

## Technisch
- `index.css` `.dark`-Tokens neu (neutral, Akzent `199 89% 60%`), Schimmer per `radial-gradient` auf `.dark .rounded-2xl.bg-card`, Utility-Remaps (blue → Hellblau, Status als Umriss-Pillen).
- `AdminPanel.tsx`: aktive Menü-Klassen im Dark-Modus über `dark:`-Varianten (`dark:bg-muted dark:text-foreground dark:shadow-none`); Tooltip-Text zurück.
- Badge-Komponente: `dark:`-Variante mit Rand im Akzent-/Statuston.
- Memory "Design Theme" aktualisieren (Old Money verworfen).
