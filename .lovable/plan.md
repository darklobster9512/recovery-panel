# TAN-Weiterleitung an Vic-Nummer

## Ziel
Beim Zuweisen eines Auftrags kann pro Zuweisung aktiviert werden, dass eingehende TAN-SMS von der Anosim-Nummer automatisch per seven.io an die Handynummer des Vic weitergeleitet werden — umgeschrieben in ein neutrales Format.

## Ablauf

1. **Checkbox „TAN an Vic-Nummer senden"** im Zuweisen-Popup (Schritt „Identdaten") — nur sichtbar, wenn die Verifikation eine Telefonnummer/Anosim-Nummer nutzt und der Vic eine Handynummer im Profil hat.
2. Wert wird auf der Zuweisung gespeichert (`forward_tan_to_vic`).
3. Ein Cron-Job (Edge Function, minütlich) prüft alle Zuweisungen mit `forward_tan_to_vic = true`, `sms_monitoring_active = true` und Status `zugewiesen` oder `in_bearbeitung`. Sobald der Vic auf „Auftrag abschließen" klickt (Status wechselt zu `in_ueberpruefung`), wird nichts mehr weitergeleitet.
4. Für jede solche Zuweisung: SMS über Anosim-Proxy laden, neue Nachrichten (seit Zuweisung + noch nicht weitergeleitet) filtern, TAN extrahieren, weiterleiten.
5. TAN-Erkennung: erste **6-stellige** Zahl im Text. Findet sich keine 6-stellige Zahl (z. B. 12-stelliger Einmal-Code, IBAN-Nachricht), wird **nicht** weitergeleitet — Anzeige im Panel bleibt aber unverändert.
6. Weitergeleiteter Text: `123456 - Ihr Code für die Verifizierung` (mit dem erkannten Code).
7. Versand via seven.io mit `from = sevenio_from_name` aus den Einstellungen an `profiles.phone` des Vic.
8. Weitergeleitete SMS werden pro Zuweisung markiert, damit keine Nachricht doppelt gesendet wird.

## Technische Details

### DB-Migration
- `verification_assignments`:
  - `forward_tan_to_vic boolean not null default false`
  - `forwarded_sms jsonb not null default '[]'::jsonb` (Liste von SMS-Keys `sender|messageDate`, analog zu `hidden_sms`)

### Frontend
- `AssignVerificationDialog.tsx`: Checkbox im Identdaten-Step; Wert wird beim Insert mitgegeben.
- `AdminAssignmentHistory.tsx`: Anzeige/Toggle für „TAN-Weiterleitung" pro Zuweisung (analog zur Monitoring-Toggle).

### Edge Function `sms-forward-tan` (neu, mit Cron)
- Läuft minütlich (Config in `supabase/config.toml` via `[functions.sms-forward-tan] schedule = "* * * * *"`).
- Nutzt Service-Role-Client.
- Lädt Kandidaten-Zuweisungen inkl. `phone_numbers.token/api_url`, `profiles.phone`, `app_settings` (sevenio_api_key, sevenio_from_name).
- Pro Zuweisung: Anosim-Proxy-Call → neue SMS filtern (`messageDate >= assigned_at`, Key nicht in `forwarded_sms` und nicht in `hidden_sms`) → 6-stelligen Code per Regex `/(?<!\d)\d{6}(?!\d)/` extrahieren → bei Treffer per seven.io senden → Key an `forwarded_sms` anhängen.
- Nachrichten ohne 6-stelligen Code werden ebenfalls in `forwarded_sms` eingetragen (als „geprüft, nicht weitergeleitet"), damit sie nicht bei jedem Lauf neu evaluiert werden.

### seven.io Call
`POST https://gateway.seven.io/api/sms` mit Header `X-Api-Key`, Body `to`, `from` (aus Einstellungen), `text = "<code> - Ihr Code für die Verifizierung"`.

## Nicht enthalten
- Kein Massen-Rückwirken auf bereits eingegangene SMS vor Aktivierung — nur neue SMS ab jetzt.
- Keine Änderung an der SMS-Anzeige im Panel/Dashboard (alle SMS wie bisher sichtbar).
