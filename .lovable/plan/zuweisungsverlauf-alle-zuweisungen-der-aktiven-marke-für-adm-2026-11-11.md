# Zuweisungsverlauf: alle Zuweisungen der aktiven Marke für Admins

## Befund
- Datenbank: Berthold & Partner hat 50 Zuweisungen, Korte & Partner 292. Die Admin-Leserechte sind korrekt (Admins dürfen alle lesen) – die Manager-Regeln greifen bei Admins nicht.
- Fehler liegt in der Liste selbst: Sie lädt nur beim ersten Öffnen bzw. nach "Zuweisen", **nicht beim Wechsel der Marke**. Sie filtert dabei mit der Marke, die beim Laden gerade aktiv (oder noch nicht fertig geladen) war. Dadurch bleibt nach dem Umschalten auf Berthold eine leere bzw. falsche Liste stehen.

## Änderung
1. Zuweisungsverlauf lädt neu, sobald die aktive Marke wechselt (oder fertig geladen ist).
2. Veraltete Antworten werden verworfen, damit eine langsame alte Abfrage die neue Liste nicht überschreibt.
3. Die anderen Admin-Listen mit Markenfilter (Dokumente, In Überprüfung, Dashboard, Livechat, Termine) auf denselben Fehler prüfen und gleich mitbeheben.

## Prüfen
- Als Admin Berthold wählen → 50 Einträge sichtbar; auf Korte wechseln → Korte-Einträge.

## Technisch
- `AdminAssignmentHistory.tsx`: `useEffect(..., [refreshToken, activeBrandingId])`, Request-Zähler gegen Race-Conditions.
- Gleiches Muster in den Geschwister-Komponenten, die `fetchBrandingProfileIds` nutzen.
