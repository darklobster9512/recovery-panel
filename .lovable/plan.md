# Thomas Klank: Ausweis-Upload zurücksetzen

## Ziel
Thomas Stephan Klank (klank-thomas@gmx.de) soll seinen Personalausweis erneut hochladen können.

## Aktueller Stand (geprüft)
- Nutzer-ID: `338bfeb3-f922-4828-8060-fdbd12f19ade`
- 2 Dateien vom 11.09.2026 (`kind = 'personalausweis'`):
  - `Personalausweis Vorderseite — …jpg`
  - `Personalausweis Rückseite — …jpg`
- `profiles.id_document_submitted_at` = 11.09.2026 — deshalb wird ihm der Upload nicht mehr angeboten.

## Schritte
1. Beide Dokument-Einträge löschen.
2. Die beiden Bilddateien aus dem Speicher entfernen.
3. Den „bereits eingereicht"-Marker zurücksetzen.

## Ergebnis
- Im Dashboard erscheint bei Thomas wieder der Ausweis-Upload (Vorder-/Rückseite).
- In /admin/dokumente verschwindet seine „Personalausweis"-Gruppe.
- Keine Code-Änderungen — nur Datenbereinigung.

## Technische Details
```sql
DELETE FROM public.user_documents
WHERE user_id = '338bfeb3-f922-4828-8060-fdbd12f19ade' AND kind = 'personalausweis';

UPDATE public.profiles SET id_document_submitted_at = NULL
WHERE id = '338bfeb3-f922-4828-8060-fdbd12f19ade';
```
Storage-Pfade (Bucket `user-documents`, via `admin-cleanup-files`):
- `338bfeb3-…/personalausweis/1789130175352_front_e5468e59-66a2-41ce-bb5f-4186a6c35afa.jpg`
- `338bfeb3-…/personalausweis/1789130175352_back_e5468e59-66a2-41ce-bb5f-4186a6c35afa.jpg`
