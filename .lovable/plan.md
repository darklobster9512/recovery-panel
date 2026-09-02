# Verifikations-Typen: Videocall & Postident

Aktuell gibt es nur einen Typ Verifikation (Store-Links + Pflichtfelder). Neu sollen beim Anlegen unter `/admin/verifikationen` zwei Typen wählbar sein:

- **Videocall** – bisheriges Verhalten (Store-Links, Anweisungen, Pflichtfelder, Zuweisung mit Datenfeldern). Default für alle bestehenden Einträge.
- **Postident** – kein App Store / Play Store, keine Pflichtverifikationsdaten. Beim Zuweisen an einen Vic wird stattdessen genau eine PDF hochgeladen.

## Änderungen

### Datenbank
- Neue Spalte `verifications.type` (Text, NOT NULL, Default `'videocall'`, Check auf `videocall | postident`). Bestehende Zeilen bekommen `'videocall'`.

### Admin – Verifikation anlegen/bearbeiten (`AdminVerifications.tsx`)
- Typ-Auswahl (Segmented: Videocall / Postident) ganz oben im Dialog.
- Bei Postident: Felder „App Store Link", „Play Store Link" und „Erforderliche Verifikationsdaten" ausblenden und beim Speichern leer setzen.
- Logo, Titel und Anweisungen bleiben für beide Typen.
- Kartenanzeige zeigt kleinen Typ-Badge.

### Zuweisen (`AssignVerificationDialog.tsx`)
- Bei Typ `postident`: nach der Vic-Auswahl kein Datenformular, sondern ein PDF-Upload-Feld (nur `.pdf`).
- Beim Speichern: Assignment anlegen (leere `field_values`, kein `phone_number_id`), danach PDF in Bucket `user-documents` unter `<user_id>/<assignment_id>/<file>` hochladen und passende Zeile in `user_documents` einfügen.
- Bei Videocall bleibt alles wie bisher.

### Anzeige beim Vic (Dashboard)
- Postident-Assignments rendern über die bestehenden Komponenten – da keine App-Links / Datenfelder vorhanden sind, entfällt der App-Block automatisch. Kein Umbau nötig, nur Sichttest.

## Technische Details

- Migration:
  ```sql
  ALTER TABLE public.verifications
    ADD COLUMN type text NOT NULL DEFAULT 'videocall'
    CHECK (type IN ('videocall','postident'));
  ```
- Types-Datei wird nach der Migration automatisch regeneriert; erst danach folgen die Frontend-Änderungen.
- Upload-Pfad nutzt den bestehenden privaten Bucket `user-documents`; vorhandene RLS-Policies decken den Fall ab.
- Kein Emailversand, keine weiteren Backend-Änderungen.
