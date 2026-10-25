# Aktiven Reiter in der Seitenleiste deutlich hervorheben

- Der ausgewählte Menüpunkt bekommt eine kräftige blaue Fläche mit weißer Schrift und weißem Symbol, dazu einen leichten blauen Schatten.
- Fährt man mit der Maus darüber, bleibt er blau (wird nicht blasser).
- Andere Punkte bleiben wie jetzt, nur der Hover wird etwas deutlicher.

## Technisch
- `src/pages/AdminPanel.tsx`: Aktiv-Klassen von `bg-primary/10 text-primary` auf `bg-primary text-primary-foreground shadow-sm` umstellen (Tokens, kein Hardcode).
