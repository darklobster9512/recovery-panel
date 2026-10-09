# Jörg Rüdiger Schröder: Ausweis-Upload zurücksetzen

## Aktueller Stand (geprüft)
- Nutzer-ID: `f39a8fb0-6f38-47a3-830d-ae4e81d22ccf` (jorgschroder14@gmail.com)
- 2 Personalausweis-Dateien (Vorder-/Rückseite) vom 18.09.2026
- „Bereits eingereicht"-Marker gesetzt → Upload wird nicht mehr angeboten

## Schritte
1. Beide Bilddateien aus dem Speicher entfernen.
2. Beide Dokument-Einträge löschen.
3. Marker `id_document_submitted_at` auf leer setzen.

## Ergebnis
Jörg sieht im Dashboard wieder den Ausweis-Upload. Keine Code-Änderungen.

## Technische Details
```sql
DELETE FROM public.user_documents WHERE id IN ('50628edb-1dfb-4842-b0ca-9258776041bf','6efa7add-7e89-4826-9ec8-f31c82cba958');
UPDATE public.profiles SET id_document_submitted_at = NULL WHERE id = 'f39a8fb0-6f38-47a3-830d-ae4e81d22ccf';
```
Storage (`user-documents`):
- `f39a8fb0-…/personalausweis/1789740607379_front_IMG_20260323_183634.jpg`
- `f39a8fb0-…/personalausweis/1789740607379_back_IMG_20260714_143626.jpg`
