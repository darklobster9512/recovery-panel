# Caller dürfen Dokumente löschen

## Ziel
Der Löschen-Button in /admin/dokumente soll nicht nur für Admins, sondern auch für Caller funktionieren — beschränkt auf die Nutzer, die dem jeweiligen Caller zugewiesen sind.

## Verhalten
- Caller sehen den Dokumentenbereich bereits und dort nur ihre zugewiesenen Nutzer.
- Der Löschen-Button funktioniert für sie genauso: Dateien werden entfernt, Einträge gelöscht, und beim Personalausweis wird der Upload wieder freigegeben.
- Fremde Nutzer bleiben für Caller unzugänglich — Löschversuche außerhalb ihrer Zuweisungen werden serverseitig abgelehnt.
- Für Admins bleibt alles unverändert.

## Aktueller Stand (geprüft)
- Löschen ist derzeit nur Admins erlaubt (Regel „Admins delete documents").
- Caller dürfen Profile ihrer zugewiesenen Nutzer bereits ändern, das Zurücksetzen des Ausweis-Markers funktioniert also schon.
- Die Hilfsfunktion zum Entfernen der Dateien lässt momentan ausschließlich Admins durch.

## Technische Details
1. Migration: Policy `Callers delete documents for assigned vics` auf `public.user_documents` — `FOR DELETE TO authenticated USING (has_role(auth.uid(),'caller') AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = user_documents.user_id AND p.assigned_caller_id = auth.uid()))`.
2. `supabase/functions/admin-cleanup-files/index.ts`: Zusätzlich zur Admin-Prüfung Caller zulassen. Für Caller wird der erste Pfadabschnitt (`<user_id>/…`) jedes Pfads ermittelt und per Service-Client geprüft, dass alle diese Nutzer `assigned_caller_id = uid` haben; sonst 403.
3. Keine Frontend-Änderung nötig.
