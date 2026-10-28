## Ursache (geprüft)

Die Anfrage für Darko Grgečić (28.10., 16:22) wurde vom externen Dienst abgelehnt, weil zwei Angaben fehlten:
- **Geburtsort fehlt**
- **PLZ fehlt**

Unsere Seite zeigt nur „Dienst antwortete mit 400“ statt dieser Gründe.

## Vorschlag

1. **Geburtsort und PLZ zu Pflichtfeldern machen** im Popup „Verifikation anfragen“, damit so eine Anfrage gar nicht erst abgeschickt werden kann.
2. **Echten Grund anzeigen**: Statt „Dienst antwortete mit 400“ steht auf der Karte z. B. „Geburtsort fehlt. PLZ fehlt.“
3. Für Darko: einfach neu anfragen und Geburtsort + PLZ eintragen (die fehlgeschlagene Anfrage blockiert die Aufträge nicht, falls doch, blende ich sie aus).

## Technisch

- `RequestVerificationsSection.tsx`: `birth_place` und `postal_code` in die Pflichtfeld-Validierung von Schritt 2 aufnehmen, Sternchen im Label.
- `supabase/functions/request-verifications/index.ts`: bei `!res.ok` aus `response.errors[].errors[]` die Texte zusammenfügen und als `error` speichern; Fallback bleibt „Dienst antwortete mit <status>“. Zusätzlich serverseitig 400 zurückgeben, wenn Geburtsort/PLZ leer sind.
- Prüfen, ob fehlgeschlagene Anfragen (`status = fehlgeschlagen`, ohne Ergebnis) in `priorAuftraege()` als „Bereits angefragt“ zählen; falls ja, ausnehmen, damit neu angefragt werden kann.
