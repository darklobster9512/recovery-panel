# Postident-PDF-Upload durch Admin reparieren

## Problem
Beim Zuweisen eines Postident-Auftrags im Admin-Panel scheitert der PDF-Upload mit "new row violates row-level security policy". Grund: Für den Bucket `user-documents` existieren nur Policies für den eigenen Ordner (`foldername[1] = auth.uid()`) sowie eine Admin-Leseregel. Der Admin lädt aber unter `{vic_id}/{assignment_id}/…` hoch — nicht in seinen eigenen Ordner — und hat keine INSERT-Berechtigung.

## Lösung
Neue Storage-RLS-Policies auf `storage.objects` für den Bucket `user-documents`, die Admins vollen Schreibzugriff geben:

- `Admins insert documents` (INSERT, WITH CHECK bucket + `has_role(auth.uid(),'admin')`)
- `Admins update documents` (UPDATE)
- `Admins delete documents` (DELETE)

Die bestehenden User-Policies bleiben unverändert, sodass Vics weiterhin nur in ihrem eigenen Ordner arbeiten.

## Vic-Upload (PDF & Bilder)
Bereits korrekt konfiguriert und wird nicht angefasst:

- `DocumentUpload.tsx` akzeptiert `image/png`, `image/jpeg`, `image/jpg`, `application/pdf` (+ docx).
- Upload-Pfad ist `{user.id}/…`, passt zur bestehenden User-INSERT-Policy.
- Bucket hat kein MIME-Whitelist-Limit.

Nach der Migration prüfe ich per Testupload, dass beides funktioniert.

## Technische Details
Migration:

```sql
CREATE POLICY "Admins insert documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'user-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'user-documents' AND public.has_role(auth.uid(), 'admin'));
```
