# Termin-Fehler bei Jung Mathias Karl beheben

## Ursache (geprüft)
Pro Vic darf immer nur ein Termin den Stand „gebucht“ haben. Jung Mathias Karl hat noch einen alten Termin vom **11.09.2026, 12:00** mit dem Stand „gebucht“. Der wurde nie auf „stattgefunden“, „nicht erreicht“ oder „abgesagt“ gesetzt. Deshalb wird der neue Termin am 27.10. abgelehnt. Insgesamt betrifft das 42 vergangene Termine, die noch auf „gebucht“ stehen.

## Änderungen
1. **Beim Buchen in /admin/termine:** Hat der Vic noch einen *vergangenen* Termin auf „gebucht“, wird dieser automatisch auf „nicht erreicht“ gesetzt. Danach wird der neue Termin angelegt.
2. **Gibt es einen offenen Termin in der Zukunft**, wird nichts überschrieben. Stattdessen erscheint die verständliche Meldung „Dieser Vic hat bereits einen offenen Termin am TT.MM. um HH:MM“ statt des technischen Fehlers.
3. **Einmalige Bereinigung:** Die 42 vergangenen Termine auf „gebucht“ werden auf „nicht erreicht“ gesetzt, damit derselbe Fehler auch bei anderen Vics nicht auftritt.

## Technische Details
- `AdminAppointments.tsx`: Vor dem Insert die offenen „gebucht“-Termine des Vics laden. Ist der Termin vergangen (Datum+Zeit < jetzt), per Update auf `nicht_erreicht` setzen, sonst eine Meldung zeigen. Fehlercode 23505 zusätzlich als Fallback in eine lesbare Meldung übersetzen.
- Bereinigung als Datenupdate: `update appointments set status='nicht_erreicht' where status='gebucht' and appointment_date < current_date`.
- Die Regel „ein offener Termin pro Vic“ bleibt bestehen.
