# Hover-Effekt für Bank-Kacheln (/admin/verifikationen)

- Beim Darüberfahren wird die Kachel minimal größer (ca. 2 %) und bekommt einen weichen Schatten.
- Übergang sanft (ca. 200 ms), beim Verlassen gleitet sie zurück.

## Technische Details
- In `src/components/AdminVerifications.tsx` an der Kachel-`Card`: `transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-lg` (Schatten über bestehendes Theme, keine festen Farben).
