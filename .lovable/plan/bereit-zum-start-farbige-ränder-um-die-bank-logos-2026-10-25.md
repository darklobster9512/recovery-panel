# Bereit zum Start: farbige Ränder um die Bank-Logos

- Auf den Karten unter „Bereit zum Start“ bekommen die Logos der fertigen Aufträge einen grünen Rand und die der nicht möglichen einen roten Rand. Noch laufende bleiben leicht ausgegraut mit gestricheltem Rand.
- Der Rand ist etwas kräftiger (2 px), damit man ihn gut sieht, im hellen wie im dunklen Design.

## Technisch
- `PreparedVerificationCards.tsx`, Logo-Kacheln auf der Karte: `bereit` → `border-2 border-success`, `fehlgeschlagen` → `border-2 border-destructive`.
