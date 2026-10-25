# Vic-Auswahl mit zwei Reitern

Im Popup „Verifikation anfragen“ bekommt der Schritt „Für welchen Vic?“ zwei Reiter über der Suchliste:

- **Verfügbar (Anzahl)** – alle Vics mit hochgeladenem Ausweis, auswählbar (Standard-Reiter).
- **Kein Ausweis (Anzahl)** – alle Vics ohne Ausweis, nur zur Ansicht, ausgegraut und nicht auswählbar, mit kurzem Hinweis „Für diese Vics muss zuerst ein Personalausweis hochgeladen werden.“

Die Suche gilt jeweils innerhalb des aktiven Reiters.

## Technisch
- `src/components/RequestVerificationsSection.tsx`: `Tabs` (shadcn) um die bestehende Command-Liste, Liste nach `hasId` filtern; Zähler pro Reiter.
