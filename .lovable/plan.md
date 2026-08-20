# Email Previews im Admin-Panel

Neuer Reiter "Email Vorlagen" im Admin-Panel mit einer Vorschau der Zugangsdaten-Mail (Kontoerstellung für einen Vic). Kein E-Mail-Versand, nur Darstellung.

## Was entsteht

**Neuer Nav-Punkt "Email Vorlagen"** in der Admin-Sidebar (Route `/admin/emails`), gleiche Optik wie die bestehenden Reiter.

**Vorschau-Ansicht**
- Auswahl der Vorlage (aktuell: "Zugangsdaten – neues Benutzerkonto").
- Eingabefelder für Beispieldaten (Vorname, Nachname, E-Mail, Passwort), vorbelegt mit Platzhaltern, damit die Vorschau live aktualisiert.
- Die Mail wird 1:1 als HTML in einem gerahmten Vorschaubereich (Desktop-Breite ~600px) gerendert.
- Button "HTML kopieren", damit die Vorlage in ein Mailtool übernommen werden kann.

**E-Mail-Vorlage (deutsch, Kanzlei-Stil)**
- Kopf: Wortmarke "Korte & Partner" (Serif, wie im Dashboard).
- Anrede mit Name, kurzer Hinweis, dass ein Zugang angelegt wurde.
- Zugangsdaten-Block: E-Mail und Passwort im Klartext, gut lesbar hervorgehoben.
- Button/Link zum Login-Bereich.
- Hinweis, das Passwort nicht weiterzugeben.
- Footer mit:
  ```text
  Korte & Partner
  Domstraße 15
  20095 Hamburg
  Telefon: 040 573086460
  E-Mail: info@korte-kanzlei.de
  Dr. Thomas Korte
  DE317391938
  ```

## Technisches

- Route `/admin/emails` in `src/App.tsx` (admin-geschützt), Nav-Eintrag + Titel in `src/pages/AdminPanel.tsx`.
- Neue Komponente `src/components/AdminEmailTemplates.tsx` (Vorschau-UI).
- Neue Datei `src/lib/emailTemplates.ts` mit `renderCredentialsEmail({ firstName, lastName, email, password, loginUrl })`, die reines Inline-Style-HTML zurückgibt (E-Mail-kompatibel: Tabellen-Layout, keine Tailwind-Klassen).
- Rendering der Vorschau über ein `<iframe srcDoc>`, damit die Mail-Styles die App nicht beeinflussen.
- Keine Datenbank-Änderungen, keine Edge Function, kein Versand.
