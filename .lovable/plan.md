# Branding-System (mehrere Marken)

Das System funktioniert wie im Referenzprojekt: Mehrere Marken teilen sich ein Portal, und jeder Vic, jeder Caller, jeder Lead und jede Telefonnummer gehört zu genau einer Marke.

## Was du bekommst

**1. Neuer Menüpunkt „Brandings“ (nur Admins)**
- Die Liste zeigt alle Marken mit Logo, Name, Domain, Anzahl Vics und Anzahl Caller.
- Beim Anlegen und Bearbeiten pflegst du folgende Felder:
  - **Firma:** Firmenname, Untertitel (z.B. „Rechtsanwaltskanzlei“), Logo, Favicon, Markenfarbe.
  - **Adresse und Recht:** Straße, PLZ und Ort, Telefon, E-Mail, Anwalt, USt-ID, Website.
  - **Domains:** Hauptdomain, weitere Domains, Portal-Subdomain (z.B. „portal“).
  - **E-Mail-Versand (Resend):** API-Key, Absendername, Absender-E-Mail.
  - **SMS-Versand (seven.io):** API-Key, Absendername.
- Der Reiter „Branding“ unter /admin/einstellungen fällt weg, ebenso die Resend- und seven.io-Felder unter „Integrationen“. Die Termin- und Backup-Einstellungen bleiben dort.

**2. Neues Branding „Korte & Partner“**
- Es wird mit den aktuellen Daten angelegt: Domstraße 15, 20095 Hamburg, Telefon 040 573076450, info@kortekanzlei.de, Dr. Thomas Korte, USt-ID DE317391938, Domain kortekanzlei.de, zusätzlich kortekanzlei.com. Die bestehenden Resend- und seven.io-Zugangsdaten werden übernommen.
- Alle bestehenden Leads, Vics, Caller und Telefonnummern werden Korte & Partner zugewiesen.

**3. Marken-Wechsel in der Sidebar (nur Admins)**
- Oben in der Sidebar steht eine Auswahl mit Logo und Name der aktiven Marke. Die Auswahl bleibt nach dem Neuladen erhalten.
- Folgende Seiten zeigen dann nur Daten der gewählten Marke: Dashboard, Leads, Vics, Caller, Termine, Livechat, Dokumente, Überprüfung, Zuweisungsverlauf und Telefonnummern.
- Neu angelegte Leads, Vics, Caller und Telefonnummern bekommen automatisch die aktive Marke.
- Name und Logo in der Sidebar kommen aus der aktiven Marke statt fest „Korte & Partner“.

**4. Zuweisungen**
- **Vic:** genau eine Marke. Bei Umwandlung aus einem Lead übernimmt er dessen Marke. In der Vic-Detailansicht kann man sie ändern.
- **Caller:** genau eine Marke, wählbar im Caller-Bearbeiten-Dialog. Caller sehen weiterhin nur ihre zugewiesenen Vics und haben keinen Marken-Wechsel.
- **Telefonnummern und Leads:** gehören der Marke, unter der sie angelegt oder importiert wurden.
- **Aufträge** (Deutsche Bank, Consorsbank usw.) bleiben für alle Marken gleich.

**5. Login-Seite je nach Domain**
- Die Login-Seite erkennt die aufgerufene Domain (z.B. portal.kortekanzlei.de) und zeigt Name, Untertitel, Logo und Farbe der passenden Marke.
- Ist keine Marke für die Domain hinterlegt, erscheint Korte & Partner.

**6. E-Mails und SMS pro Marke**
- Zugangsdaten, Absender-E-Mails, SMS, TAN-Weiterleitung und Firmendaten in E-Mails nutzen die Marke des jeweiligen Vics. Fehlen dort Angaben, werden die bisherigen globalen Einstellungen genutzt.

## Technische Details

**Datenbank**
- Neue Tabelle `brandings`:
  - `company_name`, `tagline`, `logo_url`, `favicon_url`, `brand_color`
  - `street`, `city`, `phone`, `email`, `lawyer`, `vat_id`, `website`
  - `domain`, `additional_domains text[]`, `panel_subprefix`
  - `resend_api_key`, `resend_from_name`, `resend_from_email`, `sevenio_api_key`, `sevenio_from_name`
  - `created_at`, `updated_at`
- Zugriff auf `brandings`:
  - Rechte (GRANTs) für `authenticated` und `service_role`, RLS aktiv.
  - Lesen und Schreiben über RLS nur für Admins.
- Zwei neue Datenbankfunktionen:
  - `get_branding_for_host(_host text)`: SECURITY DEFINER, für `anon` und `authenticated`. Gibt nur öffentliche Felder zurück, ohne API-Keys. Sie prüft zuerst die genaue Domain, dann die Hauptdomain, dann `additional_domains`, und fällt sonst auf die älteste Marke zurück.
  - `my_branding()`: liefert Callern die öffentlichen Felder ihrer eigenen Marke.
- Spalte `branding_id uuid references brandings` neu auf `leads`, `profiles` (Vics und Caller) und `phone_numbers`, mit Index. Ein Backfill setzt alle bestehenden Zeilen auf die Korte-Marke.
- Trigger: Ist bei einem neuen Profil `branding_id` leer und `source_lead_id` gesetzt, wird die Marke vom Lead übernommen.
- Storage-Bucket `branding-logos` (privat) mit Admin-Policies.

**Frontend**
- `src/contexts/BrandingContext.tsx`:
  - Lädt alle Marken für Admins.
  - Speichert die aktive Marke in localStorage (`active-branding-id`); eine ungültige Auswahl fällt auf die erste Marke zurück.
  - Ein Hook `useActiveBranding()` liefert `activeBrandingId`, `ready` und `setActive`.
- Neue Komponenten:
  - `AdminBrandings.tsx` (Liste und Formular) als Route `/admin/brandings` in `AdminPanel.tsx`.
  - `BrandingSwitcher` in der Sidebar.
- Filter: In den genannten Admin-Komponenten wird `.eq("branding_id", active)` auf `profiles`, `leads` und `phone_numbers` ergänzt. Für Termine, Chats, Dokumente und Zuweisungen werden zuerst die Vic-IDs der Marke geladen, dann wird `.in("user_id" / "vic_id", ids)` gefiltert (separate Abfragen, keine Joins).
- Schreibwege, die `branding_id` mitsenden:
  - Lead-Import, Telefonnummer anlegen, Caller anlegen.
  - `create-user` erhält zusätzlich `branding_id`.
- Bisherige Nutzer von `app_settings`:
  - `Auth.tsx` nutzt `get_branding_for_host(window.location.hostname)`.
  - E-Mail-Vorlagen und Buchungsseite lesen die Firmendaten aus der Marke.
  - Termin- und Backup-Felder bleiben in `app_settings`.

**Edge Functions**
- Neuer gemeinsamer Helfer `_shared/branding.ts` mit `getBrandingForUser(userId)`. Er liest die Marke per Service-Role und füllt fehlende Felder aus `app_settings` auf.
- Folgende Funktionen nutzen den Helfer: `create-user`, `resend-account-email`, `send-assignment-sms`, `_shared/forwardTan.ts`.

**Notizen**
- Memory und `AGENTS.md` werden aktualisiert: Brandings sind die Quelle der Firmendaten, und Admin-Listen werden nach der aktiven Marke gefiltert.

## Nicht enthalten
- Getrennte Aufträge pro Marke (laut deiner Antwort für alle gleich).
- Marken-Wechsel für Caller.
- Telegram-Gruppen, Chat-Vorlagen und SMS-Vorlagen pro Marke. Das kann später ergänzt werden.
