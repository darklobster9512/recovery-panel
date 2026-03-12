

# Fix: Dashboard-Inhalt unsichtbar wegen fehlender Animation

## Problem
Die Klasse `animate-fade-in` existiert nicht -- weder in `tailwind.config.ts` noch in `index.css` sind `fade-in`-Keyframes definiert. Die Elemente starten mit `opacity-0` und werden nie sichtbar, weil keine Animation sie auf `opacity: 1` setzt.

## Lösung

### `tailwind.config.ts` -- Keyframes & Animation hinzufügen

In `keyframes` einfügen:
```
"fade-in": {
  "0%": { opacity: "0", transform: "translateY(10px)" },
  "100%": { opacity: "1", transform: "translateY(0)" }
}
```

In `animation` einfügen:
```
"fade-in": "fade-in 0.5s ease-out forwards"
```

Durch `forwards` im Animation-Shorthand bleibt `opacity: 1` nach Ende der Animation erhalten -- die inline `animationFillMode`-Styles im Dashboard werden damit auch korrekt unterstützt.

### Dateien
- `tailwind.config.ts` (Zeilen 60-73)

Keine Änderungen an `Dashboard.tsx` nötig -- der bestehende Code mit `opacity-0 animate-fade-in` und inline `animationDelay`/`animationFillMode` funktioniert dann korrekt.

