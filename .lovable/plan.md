

# Dokumente Upload Feature

## Übersicht
Button "Dokumente hochladen" im Dashboard-Header → eigene Upload-Ansicht mit Auftrags-Dropdown, Datei-Upload, hochgeladene Dokumente-Liste, Sicherheitshinweisen. Admin-Panel bekommt neuen "Dokumente"-Reiter mit Tabellenübersicht und Detailansicht.

## 1. Supabase: Storage Bucket + Tabelle

### Migration
```sql
-- Storage Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('user-documents', 'user-documents', false);

-- RLS für Storage: Nutzer können eigene Dateien lesen/hochladen
CREATE POLICY "Users upload own documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins read all documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'user-documents' AND public.has_role(auth.uid(), 'admin'));

-- Metadata-Tabelle
CREATE TABLE public.user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES verification_assignments(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own documents" ON public.user_documents
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users insert own documents" ON public.user_documents
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins read all documents" ON public.user_documents
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
```

## 2. Dashboard (`src/pages/Dashboard.tsx`)

- Neuer State `showDocUpload` (boolean)
- **Header**: Button "Dokumente hochladen" in Akzentfarbe (primary), sowohl Desktop als auch Mobile
- Wenn `showDocUpload === true`: Statt Overview/Detail → Upload-Interface rendern
- Upload-Interface als eigene Komponente `DocumentUpload.tsx`

## 3. Neue Komponente `src/components/DocumentUpload.tsx`

### Layout
- Zurück-Button oben
- Sicherheits-Header mit Shield/Lock Icons: "Sichere Dokumentenübertragung"
- Sicherheits-Badges: "256-Bit SSL", "DSGVO-konform", "Server in der EU", "Ende-zu-Ende verschlüsselt"
- Dropdown (Select): Auftrag auswählen (zeigt alle Aufträge des Nutzers mit Titel)
- Datei-Upload-Bereich: Drag & Drop oder Click, akzeptiert `.png,.jpg,.jpeg,.pdf,.docx`
- Upload-Button
- Sektion "Hochgeladene Dokumente" darunter: Tabelle/Grid mit Dateiname, Typ, Datum, Vorschau-Link

### Logik
- Dateien in Supabase Storage unter `user-documents/{user_id}/{assignment_id}/{filename}` speichern
- Metadata in `user_documents` Tabelle einfügen
- Nach Upload: Liste der Dokumente für gewählten Auftrag laden und anzeigen
- Dateigröße-Limit: 20MB pro Datei, max 5 Dateien gleichzeitig

## 4. Admin: Neuer Reiter "Dokumente"

### `AdminPanel.tsx`
- Neuer Nav-Eintrag: "Dokumente" mit `FileText` Icon (oder `FolderOpen`), Pfad `/admin/dokumente`

### `App.tsx`
- Neue Route: `/admin/dokumente`

### Neue Komponente `src/components/AdminDocuments.tsx`
- Lädt alle `user_documents` mit Join auf `profiles` (Nutzer-Info) und `verification_assignments` → `verifications` (Auftrags-Titel)
- Tabellenansicht: Nutzer (Name/Email), Auftrag (Titel), Anzahl Dokumente, Datum
- Gruppiert nach user_id + assignment_id
- Klick → Detailansicht:
  - Alle Dokumente für diesen Nutzer+Auftrag
  - Bilder (png/jpg/jpeg): Inline-Vorschau via signed URL
  - PDF/DOCX: Download-Link via signed URL
  - Dateiname, Größe, Upload-Datum

### Dateien
- DB-Migration (Bucket + Tabelle + RLS)
- `src/components/DocumentUpload.tsx` (neu)
- `src/components/AdminDocuments.tsx` (neu)
- `src/pages/Dashboard.tsx` (Header-Button + showDocUpload State)
- `src/pages/AdminPanel.tsx` (neuer Nav-Eintrag + Rendering)
- `src/App.tsx` (neue Route)
- `src/integrations/supabase/types.ts` (wird automatisch aktualisiert)

