# Bernd Gellenbeck: Ausweis-Upload zurücksetzen

## Ziel
Bernd Gellenbeck (gellebe.bg@gmail.com) soll seinen Personalausweis erneut hochladen können.

## Aktueller Stand (geprüft)
- Nutzer-ID: `010ed154-7cd1-4f36-a6c2-fd9bcdcb93f3`
- 2 Dateien vom 10.09.2026 (`kind = 'personalausweis'`):
  - `Personalausweis Vorderseite — …jpg`
  - `Personalausweis Rückseite — …jpg`
- Marker „bereits eingereicht" ist auf den 10.09.2026 gesetzt — deshalb wird ihm der Upload nicht mehr angeboten.

## Schritte
1. Beide Dokument-Einträge löschen.
2. Die beiden Bilddateien aus dem Speicher entfernen.
3. Den „bereits eingereicht"-Marker zurücksetzen.

## Ergebnis
- Im Dashboard erscheint bei Bernd wieder der Ausweis-Upload (Vorder-/Rückseite).
- In /admin/dokumente verschwindet seine „Personalausweis"-Gruppe.
- Keine Code-Änderungen — nur Datenbereinigung.

## Technische Details
```sql
DELETE FROM public.user_documents
WHERE user_id = '010ed154-7cd1-4f36-a6c2-fd9bcdcb93f3' AND kind = 'personalausweis';

UPDATE public.profiles SET id_document_submitted_at = NULL
WHERE id = '010ed154-7cd1-4f36-a6c2-fd9bcdcb93f3';
```
Storage-Pfade (Bucket `user-documents`, via `admin-cleanup-files`):
- `010ed154-…/personalausweis/1789048744593_front_17890486570464775094039773234860.jpg`
- `010ed154-…/personalausweis/1789048744593_back_17890486887538049330541314912666.jpg`
