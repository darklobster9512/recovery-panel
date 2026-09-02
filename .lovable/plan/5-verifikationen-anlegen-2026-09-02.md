# 5 Verifikationen anlegen

Fügt fünf neue Einträge in die Tabelle `verifications` ein (per Daten-Insert, kein Schema-Change). Kein Logo-Upload — `logo_url` bleibt leer, du kannst es später im Admin-UI nachziehen.

## Einträge

### 1. Deutsche Bank — Videocall
- Titel: „Deutsche Bank — Video-Ident"
- App Store: https://apps.apple.com/de/app/webid/id1141600078
- Play Store: https://play.google.com/store/apps/details?id=de.webid
- Erforderliche Daten: Identcode, Identlink, Email, Telefonnummer
- Anweisungen:
  1. Lade die WebID-App aus dem App Store oder Play Store herunter.
  2. Öffne die App und gib den Identcode ein oder tippe auf den Identlink.
  3. Halte deinen gültigen Personalausweis oder Reisepass bereit.
  4. Starte den Videocall und folge den Anweisungen des Mitarbeiters.
  5. Bestätige den finalen TAN-Code, den du per SMS erhältst.

### 2. DKB — Videocall
- Titel: „DKB — Video-Ident"
- Gleiche WebID-Links und Datenfelder wie Deutsche Bank.
- Anweisungen: analog zu Deutsche Bank, angepasst auf DKB-Wording.

### 3. Consorsbank — Postident
- Titel: „Consorsbank — Postident"
- Anweisungen:
  1. Drucke den zugesandten Postident-Coupon aus (PDF im Anhang).
  2. Gehe mit dem Coupon und deinem gültigen Personalausweis oder Reisepass in die nächste Postfiliale.
  3. Übergib den Coupon dem Postmitarbeiter am Schalter.
  4. Der Mitarbeiter prüft deine Identität und scannt das Dokument.
  5. Du erhältst eine Bestätigung — die Post übermittelt die Daten automatisch an die Consorsbank.

### 4. Santander — Postident
- Titel: „Santander — Postident"
- Anweisungen: analog zu Consorsbank, angepasst auf Santander-Wording.

### 5. 21bitcoin — Videocall
- Titel: „21bitcoin — Video-Ident"
- App Store: https://apps.apple.com/at/app/21bitcoin-buy-bitcoin/id1610906606
- Play Store: https://play.google.com/store/apps/details?id=com.twentyonebitcoin
- Erforderliche Daten: Email, Telefonnummer, Passwort
- Anweisungen:
  1. Lade die 21bitcoin-App aus dem App Store oder Play Store herunter.
  2. Registriere dich mit deiner Email und deinem Passwort.
  3. Bestätige deine Telefonnummer per SMS-Code.
  4. Starte im Menü „Verifizierung" den Video-Ident-Prozess.
  5. Halte deinen gültigen Personalausweis oder Reisepass bereit und folge den Anweisungen des Mitarbeiters.

## Technisch

Ein einzelner `INSERT` in `public.verifications` mit fünf Zeilen. `created_by` bleibt `NULL` (Data-API läuft ohne Auth). Postident-Zeilen bekommen leere `required_fields`, kein App-Link. Ausführung über das `run_sql`-Tool.
