# Auto-Nutzerkonten aus Leads, Caller-Rang & Zuweisung

## Übersicht

Beim CSV-Import wird für jeden neuen Lead automatisch ein Vic-Nutzerkonto angelegt. E-Mail und SMS werden dabei sofort verschickt. Zusätzlich kommt ein neuer Rang „Caller" ins Admin-Panel: Caller sehen nur die Leads/Vics, die ihnen zugewiesen sind. Admin kann Caller-Konten erstellen und Leads/Vics einem Caller zuweisen. Der Vic sieht dann seinen Caller als Ansprechpartner statt Dr. Korte.

## Änderungen im Detail

### 1. Auto-Konto beim Lead-Import
- Nach `INSERT` der Leads in `LeadImportDialog.tsx`: für jeden neu eingefügten Lead die bestehende `create-user` Edge Function aufrufen (parallel, mit Fehlertoleranz — fehlgeschlagene Konten sammeln und im Toast anzeigen).
- Passwort: 8 Zeichen `a-z0-9`, clientseitig generiert.
- Name aus `full_name` splitten (erster Token = first_name, Rest = last_name).
- `source_lead_id`, `scam_project = vorfall`, `balance = null` setzen.
- Duplikat-Schutz: bei bereits existierender Auth-User-E-Mail überspringen.

### 2. Neue E-Mail + SMS beim Kontoerstellen
- E-Mail-Text überarbeiten (in `supabase/functions/_shared/emailTemplate.ts` + Preview in `AdminEmailTemplates.tsx`):
  - Neuer Aufhänger: „Sie haben sich bei uns eingetragen. Unsere Blockchain-Forensik hat Vermögenswerte auf Ihren Namen identifiziert. Bitte melden Sie sich in Ihrem Mandantenportal an."
  - Zwei Buttons/Links: **Mandantenportal** (`buildLoginUrl` mit `panel_subprefix`) und **Kanzlei-Website** (ohne Subprefix, nur `https://{website}`).
- Neue SMS-Vorlage `new_user_sms` in `sms_templates_config`:
  - Default: „Guten Tag {{first_name}}, Sie haben sich bei {{company_name}} eingetragen. Unsere Blockchain-Forensik hat Vermögenswerte auf Ihren Namen gefunden. Details finden Sie in der E-Mail an {{email}}."
- `create-user` verwendet neuen Key statt `credentials`; alte Vorlage bleibt als Fallback.
- `AdminSettings.tsx` bekommt das neue Textarea-Feld zur Bearbeitung.

### 3. Caller-Rang
- Neuer Enum-Wert `caller` in `app_role`.
- `has_role(_, 'caller')` funktioniert automatisch.
- `ProtectedRoute`: `requiredRole` wird zu `AppRole[] | AppRole`. Caller darf alle `/admin/*`-Routen sehen außer `/admin/caller` (neue Seite, nur admin).
- Sidebar in `AdminPanel.tsx`: „Caller"-Reiter nur für Admin ausblenden bei Role `caller`.

### 4. Caller-Verwaltung `/admin/caller`
- Neue Komponente `AdminCallers.tsx` + Route.
- Tabelle listet Caller (Name, E-Mail, Nummer, Avatar).
- „Caller hinzufügen"-Dialog: Name, E-Mail, Nummer, Passwort (autogeneriert), Bild-Upload (Storage-Bucket `caller-avatars`, public).
- Erweiterung `create-user`: neuer Parameter `role: 'user' | 'caller'`. Bei `caller` wird Rolle `caller` gesetzt, keine Kunden-E-Mail versendet.
- `profiles`-Felder für Caller: `first_name`, `last_name`, `phone`, neues Feld `avatar_url`.

### 5. Zuweisung Vic/Lead → Caller
- Neue Spalte `profiles.assigned_caller_id uuid references auth.users(id)` (Vic-Zuweisung).
- Neue Spalte `leads.assigned_caller_id uuid` (Lead-Zuweisung).
- Beim automatischen Konto aus Lead: bereits vorhandene `leads.assigned_caller_id` auf das Vic-Profil übertragen.
- UI:
  - `AdminLeads.tsx` / `AdminLeadDetail.tsx`: Dropdown „Zuständiger Caller" mit sofortigem Update.
  - `AdminVics.tsx` / `AdminVicDetail.tsx`: gleiches Dropdown.
- RLS: Caller sehen `leads`/`profiles` nur, wenn `assigned_caller_id = auth.uid()`. Zusätzliche Policies neben bestehenden Admin-Policies. Für abhängige Tabellen (`lead_notes`, `lead_activity`, `verification_assignments`, `user_documents`) SELECT-Policy „Caller sieht Daten der ihm zugewiesenen Vics/Leads".
- Grants: bestehende Grants für `authenticated` reichen; Policies filtern.

### 6. Vic-Status abhängig von Ausweis
- Neues Feld `profiles.member_status text` mit Werten `in_bearbeitung` (default) und `aktiv`.
- Trigger auf `profiles`: wenn `id_document_submitted_at` von `NULL` auf gesetzt wechselt → `member_status = 'aktiv'`.
- Backfill: alle bestehenden Vics setzen (aktiv wenn Ausweis vorhanden, sonst in_bearbeitung).
- Anzeige-Badge in `AdminVics.tsx` und `AdminVicDetail.tsx`. „Pre-Member" = `in_bearbeitung` ohne Caller.

### 7. Ansprechpartner-Card im /dashboard
- `Dashboard.tsx` lädt zusätzlich `assigned_caller_id` + Caller-Profil (name, phone, avatar_url).
- Wenn Caller zugewiesen: Sidebar-Card zeigt Caller (Avatar, Name, „Persönlicher Berater", Nummer).
- Fallback: bestehende Dr.-Korte-Card.

## Technische Details

- Migrationen:
  1. `ALTER TYPE app_role ADD VALUE 'caller';` (eigene Migration, muss vor Nutzung committed sein).
  2. `profiles`: `assigned_caller_id`, `avatar_url`, `member_status` (Enum-lite als Text mit Check).
  3. `leads`: `assigned_caller_id`.
  4. Trigger `profiles_member_status_from_id_doc`.
  5. Neue RLS-Policies (Caller-Read) auf `leads`, `profiles`, `lead_notes`, `lead_activity`, `user_documents`, `verification_assignments`.
  6. `sms_templates_config` INSERT `new_user_sms`.
- Storage-Bucket `caller-avatars` (public) via `supabase--storage_create_bucket`.
- Edge Function `create-user`: Body-Schema erweitern (`role`, optional `avatar_url`), Mail/SMS nur bei `role='user'` versenden, neues SMS-Template referenzieren, Website-Link im Payload ergänzen.
- `AuthContext` `AppRole` Typ erweitern; `ProtectedRoute` akzeptiert Array.
- Kein Auto-Retry für fehlgeschlagene Konten beim Import — Toast listet betroffene E-Mails.

## Offene Rückfragen

Keine — Spezifikation ist vollständig. Vorschlag: die Website-URL im Mail-Text als sichtbaren Sekundär-Link unter dem Portal-Button rendern.
