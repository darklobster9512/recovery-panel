# Plan: E-Mail-Duplikate beim Lead-Import überspringen

## Was ändert sich
Beim CSV-Import werden Leads, deren E-Mail bereits in `public.leads` existiert, vor dem Insert herausgefiltert und nicht importiert. Zusätzlich werden Duplikate innerhalb derselben Datei erkannt.

## Ablauf
1. CSV parsen wie bisher.
2. Innerhalb der Datei: Bei mehreren Zeilen mit gleicher E-Mail nur die erste behalten.
3. Alle E-Mails der Datei per `select email from leads where email in (...)` (case-insensitive, normalisiert auf lowercase + trim) abfragen.
4. Alle Zeilen mit bereits vorhandener E-Mail rausfiltern.
5. Rest über den bestehenden `upsert` einfügen.
6. Toast: `X neue Leads importiert, Y Duplikate übersprungen (Z per E-Mail, W in der Datei)`.

## Hinweise
- Leads ohne E-Mail werden nicht dedupliziert (immer importiert).
- Keine Schemaänderung nötig, kein Unique-Constraint auf `email` (bestehende Daten könnten Duplikate enthalten).

## Technisch
- Datei: `src/components/LeadImportDialog.tsx`, Funktion `handleImport`.
- Normalisierung: `email.trim().toLowerCase()`.
