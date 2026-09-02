# Zuweisen-Popup verbessern

Fixes für den „Zuweisen"-Dialog unter `/admin/verifikationen`.

## Probleme & Lösungen

### 1. Doppelte Eingabefelder (z. B. 21bitcoin: 2× Email, 2× Passwort)
Ursache liegt in den Daten, nicht im UI: `verifications.required_fields` enthält bei den 5 initial angelegten Aufträgen sowohl die deutschen Labels („Email", „Passwort", „Telefonnummer", …) als auch die Keys („email", „password", „phone", …). Der Dialog rendert deshalb jedes Feld doppelt – einmal als Key (mit Platzhalter) und einmal als Label (ohne Platzhalter, weil das Label nicht im `FIELD_LABELS`-Mapping steht).

Fix: einmaliger Daten-Cleanup via `run_sql`, der `required_fields` auf die kanonischen Keys reduziert:

- Deutsche Bank / DKB: `['identcode','identlink','email','phone']`
- 21bitcoin: `['email','phone','password']`
- Postident-Aufträge bleiben leer.

### 2. Auftrag im Daten-Step nicht sichtbar
Im zweiten Schritt („Daten für …") steht aktuell nur der Vic-Name. Ergänzung: Logo (via `VerificationLogo`) + Titel des Auftrags werden oben im Dialog angezeigt, damit klar ist, für welchen Ident die Daten sind.

### 3. Telefonnummer-Dropdown ohne Suche
Das native `Select` wird durch eine `Popover` + `Command`-Combobox ersetzt (gleiches Pattern wie die Lead-Auswahl im Vic-Anlegen-Dialog). Sucht über die aufgelöste Nummer und den Token.

### 4. Neuer Anosim-Link soll in `phone_numbers` landen
Der Insert passiert bereits (`supabase.from('phone_numbers').insert(...)`), aber ohne sichtbare Rückmeldung. Ergänzung:

- Nach erfolgreichem Insert Toast „Telefonnummer gespeichert".
- Sofortiger `anosim-proxy`-Aufruf, damit die neu hinzugefügte Nummer im Dropdown mit der echten Rufnummer erscheint (nicht nur mit Token).
- Danach automatisch als ausgewählte Nummer setzen.

## Technisch

- Datei: `src/components/AssignVerificationDialog.tsx` (UI-Änderungen + Combobox).
- Datei: `run_sql`-Cleanup gegen `public.verifications` (kein Schema-Change).
- Keine Migrationen, keine neuen Tabellen, keine Änderungen an anderen Screens.
