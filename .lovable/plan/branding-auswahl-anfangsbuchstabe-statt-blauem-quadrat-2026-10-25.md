# Branding-Auswahl: Anfangsbuchstabe statt blauem Quadrat

- Im Dropdown der Branding-Auswahl (und bei der Kontoauswahl der Caller) steht bei Marken ohne Logo statt des farbigen Quadrats nur noch der Anfangsbuchstabe in Blau, z. B. „K“ für Korte & Partner und „T“ für Test.
- Marken mit Logo zeigen weiterhin ihr Logo.

## Technisch
- `src/pages/AdminPanel.tsx`, Zeilen 239 und 271: Ersatz-`<span>` mit Hintergrundfarbe durch `<span className="flex h-6 w-6 items-center justify-center text-sm font-bold text-primary">{name.charAt(0).toUpperCase()}</span>` ersetzen.
