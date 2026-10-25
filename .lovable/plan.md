# Verifikationen in Auftrag geben (/admin/verifikationen)

## Was der Admin/Caller sieht

**Neue Sektion ganz oben** auf /admin/verifikationen: Karte "Verifikationen in Auftrag geben" mit kurzer Erklärung in 3 Schritten:
1. Vic auswählen
2. Gewünschte Verifikationen anfragen
3. Ein Mitarbeiter bearbeitet sie, nach ca. 1-2 Stunden sind sie verfügbar

Button "Verifikation anfragen" öffnet das Popup. Darunter Liste "Meine angeforderten Verifikationen" (siehe unten).

**Popup, Schritt 1 - Vic wählen:** Suchbare Vic-Auswahl (nur Vics der aktiven Marke bzw. beim Caller seine eigenen). Vics ohne hochgeladenen Personalausweis sind markiert und nicht wählbar.

**Popup, Schritt 2 - Daten prüfen (50/50):**
- Links: Vorder- und Rückseite des Ausweises untereinander (scrollbar).
- Rechts: Beim Öffnen liest die KI die Daten aus den Bildern und füllt die Felder (Ladezustand "KI liest Ausweis aus...").
- Fetter Hinweis oben: "Diese Daten wurden per KI extrahiert. Bitte prüfen und korrigieren. Wichtiger Schritt: Sind Daten falsch übernommen, werden alle Verifikationen ungültig."
- Pflicht: Vorname(n), Nachname. Optional: Geburtsname, Geburtsdatum (TT.MM.JJJJ, wird geprüft), Geburtsort, Straße und Hausnummer, PLZ, Ort.
- "Aktuelle Bank" (Pflicht) mit i-Punkt: "Bei welcher Bank ist der Vic selbst angemeldet?" Die Banken-Liste (Dropdown) kommt aus den vorhandenen Aufträgen; Freitext bleibt möglich.
- Weiter nur, wenn Pflichtfelder gefüllt und das Datum gültig ist.

**Popup, Schritt 3 - Verifikationen wählen:** Vorausgewählt: Commerzbank-Videoident, DeutscheBank-Videoident, BBVA-Videoident, Consorsbank-Postident, Santander-Postident. Alle weiteren Aufträge sind optional wählbar.

**Popup, Schritt 4 - Überprüfung:** Zusammenfassung aller Daten, Bank und gewählter Verifikationen. "Verbindlich anfordern" löst die Anfrage aus. Danach schließt das Popup mit Bestätigung.

**Liste auf der Seite:** Pro Anfrage: Vic, Datum, Verifikationen mit Status-Pille "In Bearbeitung - noch nicht verfügbar" (gelb) und Hinweis "Verfügbar in ca. 1-2 Stunden". Fehlgeschlagene Anfragen zeigen "Fehlgeschlagen" mit Grund. Es gibt vorerst keine automatische oder manuelle Umstellung auf "verfügbar" (so gewünscht).

## Versand

Edge Function sendet an `https://prepare-panel.xyz/api/public/vics`:

```text
{ first_name, last_name, birth_name, birth_date "TT.MM.JJJJ", birth_place,
  street, postal_code, city, marital_status: null, tax_id: null,
  bank, project: "Recovery" (fest im Code),
  auftraege: ["Commerzbank-videoident", "DKB-videoident", ...] }
```

Auftrags-Namen werden aus den Titeln erzeugt (z. B. "Consorsbank — Postident" wird "Consorsbank-postident", "Video-Ident" wird "videoident"). Leere optionale Felder werden als `null` bzw. leer gesendet.

## Technisch

- **Neue Tabelle** `verification_requests` (id, vic_id, requested_by, brand via Vic, Daten-Felder, bank, auftraege text[], status `in_bearbeitung`/`fehlgeschlagen`, error, created_at) mit GRANTs und RLS: Admins alles, Caller nur Anfragen für ihnen zugewiesene Vics, jeweils nur eigene/zugewiesene lesen.
- **Neue Edge Function** `request-verifications`: prüft JWT und Rolle (Admin oder zuständiger Caller), validiert Eingaben (Zod), speichert die Anfrage, ruft die externe Adresse auf, schreibt Status/Fehler zurück. `project` ist fest "Recovery".
- **Neue Edge Function** `admin-extract-id` (oder Erweiterung von `extract-id-data` um Admin-Modus): liest Ausweisbilder des gewählten Vics per Signed URL, nutzt dieselbe KI-Logik/Prompt wie die Telegram-Extraktion, aber ohne Telegram-Versand. Zugriff nur Admin/zuständiger Caller. Gibt zusätzlich signierte Bild-URLs für die Anzeige im Popup zurück.
- **Frontend:** neue Komponenten `RequestVerificationsSection` und `RequestVerificationsDialog` in `src/components/`, eingebunden oben in `AdminVerifications.tsx`. Pagination (20) nicht nötig, Liste zeigt die letzten 10 mit "Weitere anzeigen". Dark-Theme-Tokens und bestehende Dialog-Shell werden genutzt.
- Kein Zugangsschlüssel für die externe Adresse eingeplant; falls der Dienst einen verlangt, bitte nachreichen.
- Ungetestet bleibt zunächst der echte Aufruf der externen Adresse (kein Test-Vic, keine Anmeldung im Sandbox).
