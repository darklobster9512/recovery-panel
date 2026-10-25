# Schnellere Vic-Auswahl im Popup „Verifikation anfragen“

## Was sich ändert
- In beiden Reitern („Verfügbar“ / „Kein Ausweis“) werden zuerst nur **20 Vics** angezeigt (die neuesten).
- Darunter steht **„Weitere anzeigen“**, das jeweils 20 mehr einblendet.
- Die **Suche** (Name oder E-Mail) durchsucht immer **alle** Vics, nicht nur die angezeigten 20. Über der Liste steht der Hinweis „Tipp: Namen oder E-Mail eintippen“.
- Beim Öffnen der Auswahl steht der Cursor direkt im Suchfeld.
- Das Laden der Vics wird beschleunigt, damit die Liste schneller erscheint.

## Technisch
- `src/components/RequestVerificationsSection.tsx`:
  - Eigener Suchtext-State; Filterung selbst (`shouldFilter={false}` am `Command`), danach `slice(0, visibleCount)`; `visibleCount` startet bei 20, +20 pro Klick, Reset bei Tab-/Suchwechsel.
  - Laden: Admins fragen `profiles` direkt nach `branding_id` gefiltert ab und schließen Nicht-Vics per Rollenliste client-seitig aus (statt riesigem `.in(ids)`-Filter); Rollen- und Ausweis-Abfrage laufen parallel (`Promise.all`); Ausweis-Abfrage ohne `.in(...)`-Liste, nur `user_id` mit `kind = personalausweis`.
  - Verifikationsliste lädt parallel, blockiert die Vic-Liste nicht.
