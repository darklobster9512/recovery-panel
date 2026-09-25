# Deutsche Bank — Postident anlegen

## Änderung
Neue Auftragsvorlage in `public.verifications` einfügen:

- Titel: `Deutsche Bank — Postident`
- Typ: `postident`
- Keine App-Store- oder Play-Store-Links
- Keine erforderlichen Ident-Daten
- Anweisungen im Stil der bestehenden Postident-Vorlagen (Consorsbank, Santander, Targobank):
  1. Sie erhalten von uns eine PDF mit dem Postident-Coupon.
  2. Gehen Sie mit der PDF und Ihrem Ausweis zur nächsten Postfiliale.
  3. Der Postmitarbeiter identifiziert Sie und schickt die Daten an die Deutsche Bank.
- Logo bleibt zunächst leer und kann wie bei den anderen Vorlagen im Admin-Bereich hochgeladen werden

## Technisch
Ein Daten-Insert für eine Zeile (`run_sql`); keine Änderung an Tabellenstruktur, Oberfläche oder bestehenden Verifikationen — auch die bestehende „Deutsche Bank — Video-Ident" bleibt unverändert.
