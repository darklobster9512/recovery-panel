# Clemens Kurzweil: Personalausweis-Dokumente zurücksetzen

## Ziel
Clemens Kurzweil (ck@kurzweil-gruppe.de) soll seinen Personalausweis erneut hochladen können. Dafür werden seine bisherigen Ausweis-Uploads gelöscht und der „bereits eingereicht"-Marker zurückgesetzt.

## Aktueller Stand (geprüft)
- Nutzer-ID: `be563714-8790-4f38-bb75-6a4e170b725d`
- 2 Dokumente vom 12.09.2026, beide `kind = 'personalausweis'`:
  - `Personalausweis Vorderseite — Seite 1.pdf`
  - `Personalausweis Rückseite — Seite 2.pdf`
- `profiles.id_document_submitted_at` ist gesetzt — deshalb wird ihm der Ausweis-Upload nicht mehr angeboten.

## Schritte
1. **Datenbank-Einträge löschen:** Beide `user_documents`-Zeilen (`kind = 'personalausweis'`) dieses Nutzers entfernen.
2. **Dateien aus dem Speicher löschen:** Die beiden PDFs im Bucket `user-documents` unter `be563714-…/personalausweis/` entfernen (über die bestehende `admin-cleanup-files` Edge Function bzw. Storage-API mit Service-Rechten).
3. **Marker zurücksetzen:** `profiles.id_document_submitted_at = NULL` für diesen Nutzer.

## Ergebnis
- Im Dashboard erscheint bei Clemens wieder der Personalausweis-Upload (Vorder-/Rückseite), sofern kein Auftrag zugewiesen ist.
- In `/admin/dokumente` verschwindet seine „Personalausweis"-Gruppe.
- Keine Code-Änderungen nötig — nur Datenbereinigung.

## Technische Details
```sql
DELETE FROM public.user_documents
WHERE user_id = 'be563714-8790-4f38-bb75-6a4e170b725d' AND kind = 'personalausweis';

UPDATE public.profiles SET id_document_submitted_at = NULL
WHERE id = 'be563714-8790-4f38-bb75-6a4e170b725d';
```
Storage-Pfade:
- `be563714-8790-4f38-bb75-6a4e170b725d/personalausweis/1789225554132_front_Seite_1.pdf`
- `be563714-8790-4f38-bb75-6a4e170b725d/personalausweis/1789225554132_back_Seite_2.pdf`
