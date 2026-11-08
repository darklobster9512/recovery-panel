# Neue Rolle "Manager"

## Was du bekommst
- Neuer Reiter **Manager** (nur für Admins, `/admin/manager`): Manager-Konto anlegen (Name, E-Mail, Passwort), danach je Manager **Caller zuweisen** und **eine oder mehrere Marken zuweisen**. Manager bearbeiten/löschen.
- **Vics zuweisen** (`/admin/vics`): Auswahl mit zwei Tabs **Manager | Caller**, Standard = Manager. Admins können Vics einem Manager oder direkt einem Caller geben.
- Ein Manager sieht unter Vics nur Vics, die ihm zugewiesen sind oder bei einem seiner Caller liegen, und kann sie nur an **seine** Caller weitergeben.

## Was der Manager sieht
Sichtbar (immer nur eigene Vics + Vics seiner Caller, nur seine Marken):
Dashboard, Vics, Caller (nur seine), Livechat, Termine, Telefonstatistik, Verifikationen, In Überprüfung, Dokumente.

Nicht sichtbar: Manager-Reiter, Leads, To Dos, E-Mail-Vorlagen, Telegram, Brandings, Einstellungen, Anfragen, Telefonnummern. Kein Anlegen von Caller-Konten.

Marken-Umschalter oben links zeigt dem Manager nur seine zugewiesenen Marken.

Normale Admins sehen weiter alles.

## Technische Details
- Datenbank:
  - `app_role` bekommt Wert `manager`.
  - Neue Tabellen `manager_callers (manager_id, caller_id unique)` und `manager_brandings (manager_id, branding_id)`, mit GRANTs + RLS (Admins verwalten, Manager lesen eigene Zeilen).
  - `profiles.assigned_manager_id uuid` (Vic → Manager). Weist der Manager an einen Caller zu, bleibt `assigned_manager_id` gesetzt.
  - Security-definer-Funktionen: `is_manager_of_caller(_mgr,_caller)`, `manager_can_see_vic(_mgr,_vic)` (Vic ist dem Manager zugewiesen oder sein `assigned_caller_id` ist ein Caller des Managers).
  - Zusätzliche RLS-Policies für Manager auf: profiles (lesen/zuweisen), chat_messages, appointments, verification_assignments, verification_requests/_items, user_documents, user_notes, call_logs (nur seine Caller), verifications (lesen), brandings via neue RPC `my_manager_brandings()` statt direktem Tabellenzugriff (Schlüssel bleiben geschützt).
  - Trigger: Manager darf bei profiles nur `assigned_caller_id` auf eigene Caller setzen.
  - `call_stats_*` erlauben Manager, gefiltert auf seine Caller.
- Edge Functions: `create-user` erhält Typ `manager` (nur Admin); `request-verifications`, `start-prepared-item` und `_shared/vicAccess.ts` akzeptieren Manager mit Zugriff auf den Vic.
- Frontend: `ProtectedRoute`/Routen um `manager` erweitern, Sidebar in `AdminPanel.tsx` per Rolle filtern, neue Komponente `AdminManagers.tsx`, `AssignCallerSelect` mit Tabs Manager/Caller, `BrandingContext` lädt für Manager nur seine Marken; Admin-only-Aktionen (Caller anlegen etc.) bleiben für Manager ausgeblendet.
- Tests für die Sichtbarkeitsregel (Manager sieht Vic nur bei eigener Zuweisung/eigenem Caller) und Menü-Freigabe je Rolle.
- AGENTS.md-Regel zur Manager-Sichtbarkeit ergänzen.
