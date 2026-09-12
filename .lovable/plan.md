# Caller-Upload bei PostIdent-Aufträgen erlauben

## Problem
Beim Zuweisen eines PostIdent-Auftrags lädt der Dialog das PostIdent-PDF in den `user-documents`-Speicher hoch. Für Admins klappt das, für Caller nicht:

- Die Tabelle `user_documents` erlaubt Callern bereits, Einträge für zugewiesene Nutzer anzulegen (Policy „Callers insert documents for assigned vics").
- Der Datei-Speicher (`user-documents`-Bucket) erlaubt Uploads aber nur Admins und dem Nutzer selbst. Caller haben dort nur Lese-Rechte (Policy „Callers read assigned documents", nur SELECT).
- Ergebnis: Der PDF-Upload im Zuweisungs-Dialog (`src/components/AssignVerificationDialog.tsx`) schlägt für Caller mit einer Berechtigungsfehlermeldung fehl.

## Lösung
Eine Datenbank-Migration ergänzt die fehlende Speicher-Freigabe:

- Neue Storage-Policy „Callers insert documents for assigned vics" auf `storage.objects` für den `user-documents`-Bucket:
  - Rolle: `caller`
  - Einschränkung: Der Ordner der Datei (erster Pfadteil = Nutzer-ID) muss zu einem Profil gehören, dessen `assigned_caller_id` dem angemeldeten Caller entspricht — analog zur bestehenden Lese-Policy und zur Chat-Anhänge-Policy.
  - Damit bleibt der Upload auf die eigenen, zugewiesenen Nutzer beschränkt.

## Technische Details
- Betroffene Stelle im Code: `AssignVerificationDialog.tsx` (PostIdent-PDF-Upload, ca. Zeile 334) — keine Code-Änderung nötig, der Upload funktioniert dann automatisch.
- SQL: `CREATE POLICY "Callers insert documents for assigned vics" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'user-documents' AND public.has_role(auth.uid(), 'caller') AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id::text = (storage.foldername(name))[1] AND p.assigned_caller_id = auth.uid()));`
- Keine Änderungen an Frontend oder anderen Policies.
