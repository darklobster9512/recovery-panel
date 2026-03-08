

# 50/50 Split: Zugangsdaten & Telefon/SMS

## Aktuelles Layout
Die Detail-Ansicht (Zeilen 228-400) zeigt alles vertikal gestapelt in `max-w-2xl`. Zugangsdaten, Telefonnummer und SMS sind untereinander.

## Änderungen in `src/pages/Dashboard.tsx`

1. **Container verbreitern**: `max-w-2xl` → `max-w-5xl` für die Detail-Ansicht (Zeile 230)

2. **50/50 Grid einfügen**: Nach den App-Links (Zeile 274) ein `grid grid-cols-1 md:grid-cols-2 gap-6` erstellen:
   - **Linke Spalte**: Zugangsdaten-Sektion (Zeilen 277-306) — Credentials mit Copy-Buttons
   - **Rechte Spalte**: Telefonnummer (Zeilen 309-331) + SMS-Nachrichten (Zeilen 334-381) zusammen

3. **Anleitung bleibt unterhalb** des Grids als volle Breite

### Dateien
- `src/pages/Dashboard.tsx`

