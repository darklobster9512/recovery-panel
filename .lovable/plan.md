

# Plan: Verlauf-Card Höhe begrenzen

In `AdminSmsSpoof.tsx`: Die rechte "Verlauf"-Card soll maximal so hoch sein wie die linke "SMS senden"-Card. Dazu beide Cards in ein Layout mit gleicher Höhe setzen und den Tabellenbereich scrollbar machen.

**Änderung:** Das `max-h-[500px]` auf dem Table-Container durch eine flexible Lösung ersetzen — die beiden Cards im Grid bekommen `items-start` und die Verlauf-Card bekommt `max-h` passend zur Send-Card, oder besser: beide Cards teilen sich die gleiche Höhe via `h-full` + `overflow-auto` auf dem Inhalt. Konkret:
- Grid bekommt `items-start` 
- Verlauf-Card: feste `max-h` die zur SMS-senden-Card passt, Table-Container bekommt `overflow-auto flex-1`
- Oder einfacher: `max-h-[400px]` auf den Table-Scroll-Bereich setzen (statt 500px), passend zur typischen Höhe der Send-Form

Einfachste robuste Lösung: Beide Cards in ein CSS-Grid mit `grid-rows` gleicher Höhe — nein, besser: Die linke Card bestimmt die Höhe, die rechte passt sich an. Dazu `items-stretch` entfernen und stattdessen die rechte Card `max-h` via CSS an die linke binden. 

Pragmatischster Ansatz: Das Grid bekommt `items-start`, die Verlauf-Card bekommt eine feste Struktur mit `overflow-hidden` und der Tabellen-Container bekommt `overflow-auto` mit einer begrenzten Höhe. Da die SMS-senden-Card ca. 380-400px hoch ist, setzen wir die Verlauf-Card auf dieselbe feste Höhe.

**Datei:** `src/components/AdminSmsSpoof.tsx`
- Grid: `items-start` hinzufügen
- Verlauf-Card: `h-fit max-h-[420px] flex flex-col` + CardContent bekommt `flex-1 overflow-hidden` + Table-Wrapper bekommt `overflow-auto` mit dynamischer Höhe
- Den bestehenden `max-h-[500px]` auf dem Table-Wrapper entfernen/anpassen

