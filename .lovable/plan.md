# Verifikations-Typen: Videocall & Postident

Aktuell gibt es nur einen Typ Verifikation (App-basiert mit Store-Links + Pflichtfeldern). Neu sollen beim Anlegen unter `/admin/verifikationen` drei Typen wählbar sein:

- **App** (bisheriges Verhalten, Default für alle bestehenden Einträge)
- **Videocall** – identisch zu App (Store-Links, Anweisungen, Pflichtfelder, Zuweisung mit Datenfeldern)
- **Postident** – kein App Store / Play Store, keine Pflicht­verifikationsdaten. Beim Zuweisen an einen Vic wird stattdessen genau eine PDF hochgeladen.

## Änderungen

### Datenbank
- Neue Spalte `verifications.type` (Text, Default `'app'`, NOT NULL, Check auf `app | videocall | postident`). Bestehende Zeilen bekommen `'app'`.

### Admin – Verifikation anlegen/bearbeiten (`AdminVerifications.tsx`)
- Typ-Auswahl (Radio/Segmented: App / Videocall / Postident) ganz oben im Dialog.
- Bei Postident: Felder „App Store Link", „Play Store Link" und „Erforderliche Verifikationsdaten" ausblenden und beim Speichern leer setzen.
- Logo, Titel und Anweisungen bleiben für alle Typen erhalten.
- Kartenanzeige zeigt kleinen Typ-Badge (App / Videocall / Postident).

### Zuweisen (`AssignVerificationDialog.tsx`)
- Bei Typ `postident`: nach der Vic-Auswahl kein Datenformular, sondern ein PDF-Upload-Feld (nur `.pdf`, max. z.B. 20 MB).
- Beim Speichern: Assignment anlegen (leere `field_values`, kein `phone_number_id`), danach PDF in Bucket `user-documents` unter `<user_id>/<assignment_id>/<file>` hochladen und passende Zeile in `user_documents` einfügen.
- Bei App/Videocall bleibt alles wie bisher.

### Anzeige beim Vic (Dashboard)
- Postident-Assignments werden dort ohnehin schon über die bestehenden Komponenten gerendert – da keine App-Links / Datenfelder vorhanden sind, entfällt der App-Block automatisch. Kein zusätzlicher Umbau nötig; nur ein kurzer Sichttest.

## Technische Details

- Migration:
  ```sql
  ALTER TABLE public.verifications
    ADD COLUMN type text NOT NULL DEFAULT 'app'
    CHECK (type IN ('app','videocall','postident'));
  ```
- Der Types-Datei-Regen läuft nach der Migration automatisch; erst danach werden die Frontend-Änderungen committet.
- Upload-Pfad nutzt den bereits existierenden privaten Bucket `user-documents`; RLS-Policies (`Users insert own documents`, `Users read own documents`, `Admins read all documents`) decken den Fall ab.
- Kein Emailversand, keine sonstigen Backend-Änderungen.
