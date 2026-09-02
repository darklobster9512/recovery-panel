# Logos werden nicht angezeigt

## Ursache
Der Storage-Bucket `verification-logos` ist privat, der Upload-Code speichert aber `getPublicUrl(...)` in `verifications.logo_url`. Private Buckets liefern über diese URL keinen Inhalt → das Bild bleibt leer.

## Fix
- Bucket `verification-logos` auf **public** setzen (`supabase--storage_update_bucket`).
- Alle bereits gespeicherten Logo-URLs funktionieren dann sofort, kein Code- und kein Datenänderung nötig.

## Falls der Workspace public Buckets blockiert
Sollte das Tool mit `cloud_block_public_buckets` ablehnen, muss die Einstellung einmalig unter Workspace → Settings → Privacy & Security aktiviert werden (nur Admin/Owner). Danach den Fix nochmal ausführen.
