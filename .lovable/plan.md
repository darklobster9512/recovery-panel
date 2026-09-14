# Caller bearbeiten

Auf der Seite "Caller" kann jeder Eintrag künftig nachträglich geändert werden.

## Was neu ist

- Jede Zeile in der Caller-Tabelle bekommt rechts einen Button "Bearbeiten".
- Es öffnet sich ein Fenster im gleichen Stil wie "Neuen Caller erstellen" mit:
  - Vorname, Nachname (änderbar)
  - Telefonnummer (setzen, ändern oder leeren)
  - E-Mail (nur zur Anzeige, nicht änderbar)
  - Profilbild: aktuelles Bild als Vorschau, neues Bild hochladen oder Bild entfernen
- Speichern aktualisiert die Liste sofort; Erfolg und Fehler werden als kurze Meldung angezeigt.

## Technische Umsetzung

- Nur `src/components/AdminCallers.tsx` wird erweitert: zweiter Dialog (Edit-Modus) mit eigenem State (`editing: Caller | null`, Formularfelder, neue Datei, "Bild entfernen"-Flag).
- Speichern:
  - Bei neuer Datei: Upload nach `caller-avatars` unter `<callerId>/avatar.<ext>` mit `upsert: true`, danach `profiles.avatar_url` auf den Pfad setzen.
  - Bei "Bild entfernen": Datei aus dem Bucket löschen und `avatar_url` auf `null` setzen.
  - `profiles`-Update für `first_name`, `last_name`, `phone` (leerer Wert wird `null`).
  - Danach `load()` aufrufen, damit Liste und signierte Bild-URLs neu geholt werden.
- Vorschaubild nutzt die bereits vorhandene `avatarUrls`-Map bzw. eine lokale Object-URL für die neu gewählte Datei.
- Keine Datenbank- oder Policy-Änderung geplant; sollte das Speichern des Bildes an den Storage-Rechten scheitern, wird eine Admin-Policy für Uploads/Löschen im Bucket `caller-avatars` nachgezogen.
