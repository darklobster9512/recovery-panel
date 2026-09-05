# Caller: Dokument-Vorschauen in /admin/dokumente

## Problem
Caller sehen in `/admin/dokumente` zwar die Einträge ihrer zugewiesenen Vics, aber die Bild-/PDF-Vorschauen bleiben leer. Ursache: Im Storage-Bucket `user-documents` gibt es Lesezugriffs-Regeln nur für Admins und für den jeweiligen Vic selbst – Caller haben keine passende Regel, deshalb schlägt das Erzeugen der signierten Vorschau-URL fehl.

## Lösung
Eine neue Storage-Leseregel für Caller ergänzen, analog zu Chat-Anhängen: Ein Caller darf eine Datei im Bucket `user-documents` lesen, wenn der Ordnername (erster Pfadteil = Vic-ID) einem Vic gehört, der ihm zugewiesen ist.

## Technische Details
Neue Policy auf `storage.objects`:

```sql
CREATE POLICY "Callers read assigned documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'user-documents'
  AND has_role(auth.uid(), 'caller')
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND p.assigned_caller_id = auth.uid()
  )
);
```

Keine Frontend-Änderungen nötig – die bestehende Signed-URL-Logik funktioniert, sobald die Policy greift.
