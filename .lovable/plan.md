

# Anosim Partner-Logo auf der Telefonnummern-Seite

Das hochgeladene SVG-Logo wird in `src/assets/` kopiert und dezent in der "Telefonnummer hinzufuegen"-Card eingebunden -- z.B. rechts im CardHeader neben dem Titel, klein (ca. 80-100px breit), leicht transparent.

## Aenderungen

1. **Logo kopieren**: `user-uploads://Icon_Anosim_color_with_text.svg` → `src/assets/anosim-logo.svg`
2. **`AdminPhoneNumbers.tsx`**: Logo importieren und im CardHeader der "Telefonnummer hinzufuegen"-Card rechts neben dem Titel platzieren, dezent gestylt (kleine Groesse, evtl. `opacity-60`).

