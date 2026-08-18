# Datenbank-Wiederherstellung für neues Supabase-Projekt

Die neue Supabase-Instanz (`ssxqmhnpnxnwaqquswwv`) ist leer. Das Repo enthält aber noch alle 16 Original-Migrationen sowie die drei Edge Functions (`anosim-proxy`, `create-user`, `sms-spoof`). Daraus lässt sich der ursprüngliche Zustand vollständig rekonstruieren — kein Ableiten aus Logs nötig.

## Was wiederhergestellt wird

Tabellen (public):
- `profiles` – Nutzerprofil (Name, Telefon, temporäres Passwort)
- `user_roles` + Enum `app_role` (admin/user) und Funktion `has_role`
- `user_notes` – Admin-Notizen zu Nutzern
- `verifications` – Verifikationsaufträge (Titel, Logo, Anleitungen, Store-Links, Pflichtfelder)
- `phone_numbers` – Anosim-Rufnummern-Token
- `verification_assignments` + Enum `assignment_status` (zugewiesen, in_bearbeitung, abgeschlossen, in_ueberpruefung, genehmigt, abgelehnt), inkl. SMS-Monitoring-Flags
- `sms_templates` – Vorlagen für SMS-Spoofing
- `sms_spoof_history` – Verlauf gesendeter Spoof-SMS
- `user_documents` – Metadaten hochgeladener Dokumente

Storage-Buckets:
- `verification-logos` (öffentlich)
- `user-documents` (privat, Ordner = user_id)

Automatik:
- Trigger `on_auth_user_created` legt bei jeder Neuanmeldung automatisch Profil + user-Rolle an.

RLS: Nutzer sehen/bearbeiten nur eigene Daten; Admins haben Vollzugriff. Storage entsprechend abgesichert.

Edge Functions: bereits im Repo, werden nach dem Migrationslauf automatisch neu deployt. Secrets (`SMS_SPOOF_API_KEY`, `LOVABLE_API_KEY`) sind laut Projekt-Config schon gesetzt.

## Vorgehen

1. Eine einzige konsolidierte Migration erzeugen, die alle 16 alten Migrationen zusammenfasst (Enums → Tabellen → GRANTs → RLS → Policies → Storage-Buckets & -Policies → Trigger).
2. Migration ausführen lassen (Approval-Dialog).
3. Nach dem Lauf: kurz per `supabase--read_query` prüfen, dass alle Tabellen existieren; Edge Functions werden automatisch aktiv.

## Was NICHT wiederhergestellt werden kann

- Alte Nutzer, Passwörter, Auth-Sessions (auth.users ist leer – Nutzer müssen sich neu registrieren; der erste Admin muss manuell in `user_roles` eingetragen werden).
- Gespeicherte Dateien im alten Storage.
- Historische Zeilen (verifications, assignments, sms_spoof_history, notes, documents-Metadaten).

## Nach der Migration

Damit du dich als Admin anmelden kannst: einmal über die App registrieren, dann in `user_roles` die Rolle `admin` für deinen User setzen (kann ich per SQL-Migration machen, sobald du die User-ID / E-Mail nennst).
