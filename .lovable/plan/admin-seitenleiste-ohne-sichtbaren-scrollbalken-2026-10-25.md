# Admin-Seitenleiste ohne sichtbaren Scrollbalken

- In `src/index.css` eine Hilfsklasse `scrollbar-none` ergänzen (`scrollbar-width: none`, `-ms-overflow-style: none`, `::-webkit-scrollbar { display: none }`).
- In `src/pages/AdminPanel.tsx` diese Klasse an `<SidebarContent>` hängen.

Ergebnis: Kein Scrollbalken mehr in der Admin-Seitenleiste, Scrollen per Mausrad/Touchpad funktioniert weiter.
