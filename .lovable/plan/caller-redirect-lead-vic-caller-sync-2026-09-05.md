# Caller-Redirect & Lead→Vic Caller-Sync

Zwei kleine Fixes:

## 1. Caller landet nie auf /dashboard
Aktuell schickt `ProtectedRoute` (bei Zugriff auf `/dashboard` ohne passende Rolle) und `Auth.tsx` (nach Login) Caller je nach Bedingung ans falsche Ziel.

- **`src/pages/Auth.tsx`** — Nach Login: `role === "admin" || role === "caller"` → `/admin`, sonst `/dashboard`.
- **`src/components/ProtectedRoute.tsx`** — Fallback bei fehlender Rolle bereits ok; zusätzlich `/dashboard`-Aufrufe eines Callers umleiten: wenn `role === "caller"` und kein `requiredRole` gesetzt ist, auf `/admin` schicken (Caller haben auf `/dashboard` nichts zu suchen).

## 2. Lead-Caller-Zuweisung auf Vic übertragen
Jeder Lead hat ein Vic-Profil (`profiles.source_lead_id = lead.id`). Wenn im Lead ein Caller (neu) gesetzt/geändert/entfernt wird, soll der Vic automatisch denselben Caller bekommen.

Umsetzung als DB-Trigger (robust, egal ob UI oder Import die Änderung macht):

- Neue Funktion `public.leads_sync_vic_caller()` (SECURITY DEFINER, search_path=public):  
  Bei `UPDATE` auf `leads`, wenn `NEW.assigned_caller_id IS DISTINCT FROM OLD.assigned_caller_id` →  
  `UPDATE public.profiles SET assigned_caller_id = NEW.assigned_caller_id WHERE source_lead_id = NEW.id;`
- Trigger `trg_leads_sync_vic_caller AFTER UPDATE ON public.leads`.
- Einmaliges Backfill: alle Vics mit `source_lead_id` bekommen den aktuellen `leads.assigned_caller_id` gesetzt, sofern abweichend.

Keine Frontend-Änderung nötig — bestehende `AssignCallerSelect`-Aufrufe auf Leads triggern automatisch die Vic-Synchronisation.
