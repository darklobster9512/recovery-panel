# Zwei Postident-Verifikationen hinzufügen

## Änderung
Zwei neue Auftragsvorlagen in `public.verifications` anlegen:

- `Commerzbank — Postident`
- `Targobank — Postident`

Beide übernehmen den vorhandenen Postident-Aufbau von Consorsbank und Santander:

- Typ: `postident`
- Keine App-Store- oder Play-Store-Links
- Keine erforderlichen Ident-Daten
- Anweisung im gleichen Stil: PDF mit Postident-Coupon erhalten, mit PDF und Ausweis zur Postfiliale gehen, Identifizierung durch den Postmitarbeiter und Übermittlung an die jeweilige Bank
- Logo bleibt zunächst leer und kann anschließend wie bei den anderen Vorlagen im Admin-Bereich hochgeladen werden

## Technisch
Ein Daten-Insert für beide Vorlagen; keine Änderung an Tabellenstruktur, Oberfläche oder bestehenden Verifikationen.
