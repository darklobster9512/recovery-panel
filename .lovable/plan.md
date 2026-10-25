# Neues Admin-Dashboard

Die vier Zähl-Kacheln und die „Letzte SMS“-Tabelle fallen weg. Stattdessen ein Dashboard, das zeigt, **was heute zu tun ist** und **wie es läuft**.

## Aufbau

**1. Kopfzeile** – „Tagesübersicht“ mit Datum, Buttons „Nutzer erstellen“ / „Verifikation erstellen“ bleiben.

**2. „Jetzt erledigen“ – 4 klickbare Kacheln mit Handlungsbedarf**
- Zur Überprüfung (Aufträge, die auf Prüfung warten) → /admin/ueberpruefung
- Ungelesene Chats (Vic-Nachrichten ohne Antwort) → /admin/livechat
- Termine heute (Anzahl + nächster Termin mit Uhrzeit) → /admin/termine
- Neue Leads ohne Caller → /admin/leads

Kacheln mit 0 erscheinen ruhig/grau, mit Werten > 0 farbig hervorgehoben.

**3. Kennzahlen mit Trend (letzte 7 Tage vs. Woche davor)**
- Neue Vics
- Neue Leads
- Abgeschlossene Aufträge
- Abschlussquote (abgeschlossen / alle Aufträge, in %)

**4. Diagramme**
- Aktivität der letzten 14 Tage (Balken: neue Leads, neue Vics, abgeschlossene Aufträge pro Tag)
- Auftrags-Pipeline: Verteilung nach Status (zugewiesen → in Bearbeitung → Überprüfung → abgeschlossen / abgelehnt) als Balken mit Anzahl
- Lead-Status-Verteilung (Kanzlei vs. Europol getrennt)

**5. Listen**
- Heutige & nächste Termine (max. 5, mit Vic, Caller, Uhrzeit)
- Caller-Übersicht: pro Caller zugewiesene Vics, offene Aufträge, abgeschlossene diese Woche
- Letzte Zuweisungen (wie bisher, 5 Einträge)

## Technische Details
- Nur `src/components/AdminDashboard.tsx` wird neu geschrieben; Daten über getrennte Abfragen (keine Joins), Zählungen via `count: "exact", head: true`, Zeitreihen aus `created_at` der letzten 14 Tage clientseitig gruppiert.
- Quellen: `profiles`, `user_roles`, `leads` (status, campaign, assigned_caller_id, imported_at), `verification_assignments`, `appointments`, `chat_messages` (sender_role = vic, read_at_team null).
- Diagramme mit vorhandenem `recharts` / `ui/chart`, Farben über Design-Tokens.
- Statuswerte für Pipeline und Leads werden beim Bau aus den bestehenden Enums/Badges übernommen.
