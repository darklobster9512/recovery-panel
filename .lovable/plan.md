# To Do Reiter im Admin Panel

Ein neuer Bereich "To Dos" unter `/admin/todos`, in dem der Admin Aufgaben an Caller vergibt und Caller ihre Aufgaben abarbeiten.

## Was der Admin sieht
- Liste aller To Dos mit Titel, Beschreibung, zugewiesenem Caller, Priorität und Status (Offen / Abgeschlossen).
- Button "To Do erstellen": Titel, optionale Beschreibung, Caller auswählen, optionales Fälligkeitsdatum, Priorität (Normal / Dringend).
- Filter nach Caller, Status und Priorität; abgeschlossene To Dos bleiben sichtbar.
- To Dos bearbeiten, neu zuweisen oder löschen.
- Aktivitätenprotokoll: wer hat wann welches To Do erstellt, zugewiesen, abgeschlossen oder wieder geöffnet — mit Name des Callers und Zeitstempel.

## Was der Caller sieht
- Nur die eigenen To Dos. Dringende Aufgaben werden hervorgehoben (rote Kennzeichnung).
- Häkchen, um ein To Do als abgeschlossen zu markieren (und wieder zu öffnen).
- Kein Erstellen, kein Zuweisen an andere, kein Löschen.

## Benachrichtigung
Optionales Telegram-Ereignis "To Do abgeschlossen", damit der Admin auch außerhalb des Panels informiert wird. Standardmäßig abschaltbar wie die bestehenden Ereignisse.

## Technische Umsetzung
- Migration: Tabelle `todos` (`title`, `description`, `assigned_caller_id`, `priority` enum `normal|dringend`, `status` enum `offen|abgeschlossen`, `due_date`, `created_by`, `completed_at`, `completed_by`, Timestamps) plus Tabelle `todo_activity` (`todo_id`, `actor_id`, `action`, `details jsonb`, `created_at`).
- GRANTs für `authenticated` und `service_role`, RLS aktiv:
  - Admin (`has_role(auth.uid(),'admin')`): volle Rechte auf beide Tabellen.
  - Caller: liest eigene To Dos (`assigned_caller_id = auth.uid()`), darf nur `status`, `completed_at`, `completed_by` ändern (Spalten-GRANT auf UPDATE).
  - `todo_activity`: nur Admin liest; Einträge schreibt ein SECURITY DEFINER Trigger bei Insert und bei Statuswechsel (analog `leads_log_status_change`).
- `updated_at`-Trigger über das bestehende `leads_touch_updated_at()`.
- Neuer Enum-Wert `todo_completed` für `telegram_event` und Aufruf von `notifyTelegram` beim Abschließen.
- Frontend: `src/components/AdminTodos.tsx` im Stil der bestehenden Admin-Komponenten (Card + Tabelle + DialogShell), Route `/admin/todos` in `src/App.tsx` (Admin und Caller), Navigationspunkt in `src/pages/AdminPanel.tsx` (Gruppe "Vertrieb", Icon `ListChecks`) sowie Eintrag in `pageTitle`/`renderRoute`.
- Aktivitätenprotokoll als eigene Card unterhalb der Tabelle, nur für Rolle `admin` gerendert (Muster von `LeadActivityLog.tsx`).
