

# Hover-Animation für Store-Badges

Einfache Änderung: `transition-transform duration-200 hover:scale-105` zu beiden `<img>`-Elementen hinzufügen.

### Datei: `src/pages/Dashboard.tsx`
- Zeile 265: `className="h-10 w-auto"` → `className="h-10 w-auto transition-transform duration-200 hover:scale-105"`
- Zeile 270: gleiche Änderung für Google Play Badge

