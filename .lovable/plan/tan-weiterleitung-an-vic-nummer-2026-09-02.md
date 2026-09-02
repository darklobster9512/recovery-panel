# TAN-Weiterleitung an Vic-Nummer

## Ziel
Beim Zuweisen eines Auftrags kann pro Zuweisung aktiviert werden, dass eingehende TAN-SMS von der Anosim-Nummer automatisch per seven.io an die Handynummer des Vic weitergeleitet werden — umgeschrieben in ein neutrales Format.

## Ablauf

1. **Checkbox „TAN an Vic-Nummer senden"** im Zuweisen-Popup (Schritt „Identdaten") — nur sichtbar, wenn die Verifikation eine Telefonnummer nutzt und der Vic eine Handynummer im Profil hat.
2. Wert wird auf der Zuweisung gespeichert (`forward_tan_to_vic`).
3. Weiterleitung nur solange Status `zugewiesen` oder `in_bearbeitung` UND `sms_monitoring_active = true`. Sobald der Vic auf „Auftrag abschließen" klickt (Status → `in_ueberpruefung`), stoppt die Weiterleitung.
4. TAN-Erkennung: erste isolierte **6-stellige** Zahl im Text (Regex `/(?<!\d)\d{6}(?!\d)/`). Keine 6-stellige Zahl (z. B. 12-stelliger Einmal-Code, IBAN) → keine Weiterleitung, Anzeige im Panel bleibt.
5. Weitergeleiteter Text: `123456 - Ihr Code für die Verifizierung`.
6. Versand via seven.io mit `from = sevenio_from_name` aus den Einstellungen an `profiles.phone`.
7. Weitergeleitete SMS werden pro Zuweisung markiert (`forwarded_sms`), keine Duplikate.

## Sofort-Weiterleitung (kein Minuten-Delay)

Zwei sich ergänzende Trigger, damit die TAN in Sekunden beim Vic ankommt:

**A) Inline im `anosim-proxy` (Hauptmechanismus).**
Der Proxy wird schon jetzt vom Vic-Dashboard und vom Admin-Panel im Sekundentakt gepollt, während der Auftrag läuft — genau dann, wenn eine TAN erwartet wird. Direkt nach dem Anosim-Fetch prüft die Function die zugehörige Zuweisung, filtert neue TAN-SMS und ruft seven.io **im selben Request** auf. Ergebnis: Weiterleitung erfolgt innerhalb desselben Poll-Zyklus (~1–3 s).

**B) pg_cron-Fallback alle 15 s.**
Für den Fall, dass gerade niemand pollt (Panel geschlossen), läuft ein pg_cron-Job alle 15 s, der eine neue Edge Function `forward-tan-sweep` aufruft. Diese iteriert alle aktiven Kandidaten-Zuweisungen und macht dasselbe wie (A).

## Technische Details

### DB-Migration
- `verification_assignments`:
  - `forward_tan_to_vic boolean not null default false`
  - `forwarded_sms jsonb not null default '[]'::jsonb`
- pg_cron + pg_net Extension aktivieren, Job `select cron.schedule('forward-tan-sweep', '15 seconds', $$ select net.http_post(...) $$)` mit Service-Role-Header.

### Edge Functions
- **`anosim-proxy`** erweitern: optionaler Body-Parameter `assignmentId`. Wenn übergeben, nach dem Anosim-Fetch Forwarding-Logik ausführen (Service-Role-Client, seven.io-Aufruf). Bestehende Aufrufer bleiben kompatibel.
- **`forward-tan-sweep`** (neu): lädt alle aktiven Kandidaten (`forward_tan_to_vic = true`, `sms_monitoring_active = true`, Status in (`zugewiesen`,`in_bearbeitung`), Telefonnummer + Vic-Handy vorhanden) und ruft für jede die gleiche interne Forwarding-Routine auf. Shared-Modul unter `supabase/functions/_shared/forwardTan.ts`.

### seven.io Call
`POST https://gateway.seven.io/api/sms` mit Header `X-Api-Key`, Body `to`, `from` (aus `app_settings.sevenio_from_name`), `text = "<code> - Ihr Code für die Verifizierung"`.

### Frontend
- `AssignVerificationDialog.tsx`: Checkbox im Identdaten-Step, Wert beim Insert mitgeben.
- `AdminAssignmentHistory.tsx`: Toggle „TAN-Weiterleitung" pro Zuweisung.
- Dashboard/Admin-Poller übergeben `assignmentId` an `anosim-proxy`, damit Weg (A) greift.

### seven.io Call
`POST https://gateway.seven.io/api/sms` mit Header `X-Api-Key`, Body `to`, `from` (aus Einstellungen), `text = "<code> - Ihr Code für die Verifizierung"`.

## Nicht enthalten
- Kein Massen-Rückwirken auf bereits eingegangene SMS vor Aktivierung — nur neue SMS ab jetzt.
- Keine Änderung an der SMS-Anzeige im Panel/Dashboard (alle SMS wie bisher sichtbar).
