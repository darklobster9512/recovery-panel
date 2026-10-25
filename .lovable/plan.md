# Zuweisen-Knöpfe im dunklen Design dezenter

- Nur im dunklen Design: Die Zuweisen-Knöpfe auf den Bank-Kacheln sind nicht mehr hellblau gefüllt. Sie bekommen eine dunkle Fläche mit feinem Rand und grauem Symbol und grauer Schrift.
- Beim Darüberfahren werden Rand und Symbol hellblau, damit der Knopf erkennbar bleibt.
- Im hellen Design bleibt alles wie bisher.

## Technisch
- `AdminVerifications.tsx`, Zuweisen-Button: `dark:bg-muted dark:text-muted-foreground dark:border dark:border-border dark:hover:bg-muted dark:hover:text-primary dark:hover:border-primary/50`.
