# Caller-Profilbild wird nicht angezeigt

## Ursache (geprüft)

Das Bild landet korrekt im Speicher (`caller-avatars/<id>/avatar.png`), aber der Verweis darauf wird nicht am Caller-Profil gespeichert: bei beiden neu angelegten Callern (Dr. Voigt, Julian Maier) ist das Bildfeld in der Datenbank leer. Grund: es gibt nur eine Schreib-Regel „jeder darf sein eigenes Profil ändern" — für Administratoren fehlt sie. Der Speichern-Versuch wird deshalb stillschweigend verworfen, und die Liste zeigt nur die Initialen.

Die Anzeige-Logik selbst ist identisch mit der im Livechat und in Ordnung.

## Umsetzung

1. Datenbank: Schreib-Regel ergänzen, sodass Administratoren Profile ändern dürfen (gleiche Prüfung wie beim Lesen).
2. Bild-Zuordnung robuster machen: das Profilbild wird künftig beim Anlegen des Callers serverseitig gesetzt, damit sie nicht von Client-Rechten abhängt.
3. Nachtrag für die beiden bestehenden Caller: vorhandene Bilddateien im Speicher dem jeweiligen Profil zuordnen.
4. Nach dem Speichern des Bildes wird die Liste neu geladen, sodass das Bild sofort statt der Initialen erscheint.

## Technische Details

- Migration: `CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));`
- Backfill-SQL: `avatar_url` auf `'<id>/avatar.png'` für die zwei existierenden Caller setzen (Dateien sind im Bucket vorhanden).
- `supabase/functions/create-user/index.ts`: optionaler Body-Parameter `avatar_url` wird mit Service-Role in `profiles` geschrieben; `AdminCallers.tsx` lädt das Bild weiterhin zuerst hoch und übergibt bzw. patcht den Pfad, danach `load()`.
- Signierte URLs (`createSignedUrl`, 1 h) bleiben wie im Livechat/Dashboard.
