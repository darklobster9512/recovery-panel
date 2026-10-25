# Marken-Wechsler in der Admin-Seitenleiste wieder sichtbar machen

Ursache: Der Wechsler ist schon eingebaut, er wird aber nur angezeigt, wenn Marken geladen werden. Die Tabelle `brandings` hat keine Datenbank-Freigaben (GRANT) für angemeldete Nutzer. Deshalb schlägt das Laden fehl und die Liste bleibt leer. Die beiden vorhandenen Marken (Korte & Partner, test) sind in der Datenbank vorhanden.

## Änderung
- Migration: `GRANT SELECT, INSERT, UPDATE, DELETE ON public.brandings TO authenticated; GRANT ALL ON public.brandings TO service_role;` Die Admin-only-Zugriffsregeln bleiben, die API-Keys sind weiterhin nur für Admins lesbar.
- Danach zeigt die Seitenleiste oben für Admins das aktive Branding mit Logo, darunter „Branding wechseln“. Ein Klick öffnet die Liste aller Marken plus „Brandings verwalten“, wie im Referenzprojekt.
- Prüfen, ob die übrigen neuen Tabellen und Abfragen dieselbe Lücke haben, und sie bei Bedarf mitfreigeben.
