# Telefonstatistik

## Was gebaut wird
Ein neuer Admin-Reiter **„Telefonstatistik“** (nur für Admins sichtbar, Caller werden umgeleitet).

- **Oben drei Karten:** Gesamte Telefonzeit heute, diese Woche (Mo–So), dieser Monat.
- **Umschalter Tag / Woche / Monat** mit Zurück- und Vor-Knopf; der gewählte Zeitraum steht als Text daneben (z. B. „KW 44 · 26.10.–01.11.2026“).
- **Tabelle pro Caller** für den gewählten Zeitraum: Gespräche, Telefonzeit (hh:mm), Durchschnitt je Gespräch (mm:ss), verpasste Anrufe.
- **Balkendiagramm:** Telefonzeit pro Tag im gewählten Zeitraum (bei „Tag“ ein Balken).
- **Letzte Anrufe:** Liste mit Zeit, Caller, Richtung (ein/aus), Gegenstelle, Status, Dauer; Filter nach Caller, 20 pro Seite mit der vorhandenen Pagination.
- Alle Zeiten in Europe/Berlin. Leere Ansicht, solange keine Anrufe da sind.

## Datenbank
Tabelle `call_logs` genau wie angegeben, Index auf (caller_id, started_at), zusätzlich Index auf started_at für die Liste. SELECT an authenticated, ALL an service_role, RLS an, eine Lese-Policy nur für Admins. Keine Schreib-Policies – Einträge kommen nur über den Service-Key.

Die Werte für `direction` und `status` werden per Validierungs-Trigger geprüft.

## Summen in der Datenbank
Drei SECURITY-DEFINER-Funktionen, die selbst prüfen, ob der Aufrufer Admin ist (sonst Fehler):
- `call_stats_totals()` → Sekunden heute / Woche / Monat (Berlin-Grenzen, Woche via `date_trunc('week')` = Montag).
- `call_stats_by_caller(_from date, _to date)` → je Caller: Anzahl beantworteter Gespräche, Summe Dauer, Durchschnitt, Anzahl verpasster.
- `call_stats_by_day(_from date, _to date)` → je Berliner Kalendertag die Summe Dauer (`generate_series`, damit leere Tage als 0 kommen).

Tage werden per `(started_at AT TIME ZONE 'Europe/Berlin')::date` zugeordnet. Der Browser rechnet nur den Zeitraum (from/to) aus und formatiert.

## Technische Details
- Neue Seite `src/components/admin/AdminCallStats.tsx`, Recharts-Balkendiagramm (bereits vorhanden), Eintrag in `AdminPanel.tsx` (Gruppe Vertrieb) und Route `/admin/telefonstatistik` in `App.tsx`, Admin-only.
- Zeitraum-Helfer in `src/lib/callStats.ts` (Montag-Woche, Vor/Zurück, hh:mm-Format) mit Vitest-Test für Wochenbeginn Montag/Ende Sonntag und hh:mm-Formatierung.
- Brand-Filter: call_logs hat kein Branding; die Seite zeigt alle Caller. Optional später über `profiles.branding_id` des Callers filterbar.
- Annahme: „Telefonzeit“ = Summe `duration_sec` (ohne Halten); Durchschnitt = Telefonzeit / beantwortete Gespräche; verpasst = Status `missed`.
- Der Backup-Scope erfasst die neue Tabelle automatisch als globale Tabelle.
