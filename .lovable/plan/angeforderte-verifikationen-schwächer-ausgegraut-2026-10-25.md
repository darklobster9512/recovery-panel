# Angeforderte Verifikationen: schwächer ausgegraut

- Karten in Bearbeitung werden nur noch leicht ausgegraut: deutlich weniger blass, Logos nur teilweise entfärbt. Gestrichelter Rand bleibt als Hinweis auf „noch nicht verfügbar“.

## Technisch
- `RequestVerificationsSection.tsx`: `opacity-60 grayscale` → `opacity-80 grayscale-[50%]`, Rest unverändert.
