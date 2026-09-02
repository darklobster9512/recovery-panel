# Admin-Buttons auf einheitliches Primary-Blau umstellen

## Ziel
Die Primary-Buttons im Admin-Panel sollen wieder einen seriösen, einfarbigen Blau-Hintergrund bekommen (wie die aktive Sidebar-Zeile) statt des aktuellen blau-weißen Verlaufs.

## Änderungen

1. **`src/components/ui/button.tsx`**
   - `default`-Variante von Gradient auf einfarbiges `bg-primary` umstellen.
   - Schrift bleibt `text-primary-foreground` (weiß).
   - Hover: dezenteres Dunklerwerden (`bg-primary/90` oder `hover:bg-primary/92`) statt Verlaufswechsel.
   - Blauen Schatten beibehalten, aber dezenter (`shadow-primary/30`).
   - `translate-y`-Effekt entfernen, damit es nicht spielerisch wirkt.
   - `outline`, `secondary` und `ghost` leicht an die neue Primary-Farbe anpassen (z. B. `hover:text-primary`, blau getönte Borders), ohne den hellen Card-Look zu zerstören.

2. **Visuelle Prüfung**
   - Im Preview prüfen, ob Speichern-, Zuweisen- und Aktions-Buttons im Admin-Panel jetzt einheitlich solide blau mit weißer Schrift sind.
   - Kontrast auf den Card-/Dialog-Hintergründen (`221 80% 98%`) prüfen.

## Nicht im Scope
- Keine Änderungen an Funktionalität, Größen oder Varianten-Namen.
- Keine Änderungen an Sidebar-, Card- oder Input-Farben (die wurden bereits angepasst).
