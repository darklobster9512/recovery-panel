# Daten für test@yopmail.com bereinigen

Ziel: Zugewiesenen Auftrag und Personalausweis-Daten des Vics `test@yopmail.com` entfernen.

## Schritte

1. User-ID über `auth.users` per E-Mail ermitteln.
2. Alle Einträge in `verification_assignments` für diese `user_id` löschen (inkl. zugehöriger hochgeladener Dateien im Storage-Bucket `user-documents`, falls vorhanden).
3. Personalausweis-Daten zurücksetzen:
   - Dateien im Storage-Bucket `user-documents` unter dem Ordner des Users entfernen, die zum Personalausweis-Upload gehören.
   - `profiles.id_document_submitted_at` auf `NULL` setzen, damit der Ausweis-Upload wieder verfügbar ist.

## Hinweise

- Kein Code-/Schemaänderung, reine Datenbereinigung per SQL + Storage-Löschung.
- Andere Profildaten (Guthaben, Scam-Projekt, Notizen) bleiben unberührt.
