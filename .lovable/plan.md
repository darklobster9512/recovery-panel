# Zuweisen-Knöpfe im dunklen Design als blauer Umriss

- Nur im dunklen Design: Zuweisen-Knöpfe auf den Bank-Kacheln ohne Hintergrundfläche, stattdessen hellblauer Rand, hellblaues Symbol und hellblauer Text.
- Beim Darüberfahren ein ganz leichter blauer Hauch als Fläche.
- Im hellen Design bleibt alles wie bisher.

## Technisch
- `AdminVerifications.tsx`, Zuweisen-Button: `dark:bg-transparent dark:text-primary dark:border dark:border-primary dark:hover:bg-primary/10`.
