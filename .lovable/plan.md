# Fertige Aufträge aus dem Prepare-Panel empfangen und starten

## Was du siehst

Unter "Verifikationen in Auftrag geben" gibt es pro Vic eine eigene Karte, sobald das Prepare-Panel Ergebnisse geschickt hat:

```text
+--------------------------------------------------------------+
| Max Mustermann · max@mail.de          angefragt 25.10. 14:08 |
|--------------------------------------------------------------|
| [Logo] Commerzbank · Video-Ident   Bereit         [ Starten ] |
| [Logo] Santander · Postident       Bereit (PDF)   [ Starten ] |
| [Logo] BBVA · Video-Ident          Nicht möglich: <Grund>     |
| [Logo] DKB · Video-Ident           In Bearbeitung             |
+--------------------------------------------------------------+
```

- "Starten" weist den Auftrag dem Vic zu, genau wie "Zuweisen" auf /admin/verifikationen (gleiche SMS an den Vic, gleiche Telegram-Nachricht, Telefonnummer wird angelegt, PDF wird beim Vic hinterlegt).
- Gestartete Aufträge verschwinden aus der Karte. Sind alle bereiten Aufträge gestartet, verschwindet die ganze Karte (fehlgeschlagene zählen nicht als offen).
- Fehlgeschlagene Aufträge stehen rot mit dem Hinweis "Auftrag nicht möglich" und dem Grund vom Panel.
- Noch nicht gemeldete Aufträge zeigen weiter "In Bearbeitung".

## Was pro Auftrag übertragen wird

| Auftrag | Daten |
|---|---|
| DeutscheBank-, Commerzbank-, Targobank-, DKB-videoident | E-Mail, Identlink, Anosim-Link |
| BBVA-videoident | Anmeldename, Passwort, E-Mail, Anosim-Link |
| Santander-, Consorsbank-postident | PDF mit Postident-QR-Code |

Der Identcode wird immer automatisch aus dem Identlink gezogen (letzte 9-stellige Zahl). Weitere Aufträge (z. B. Sparda) funktionieren nach demselben Muster, je nach Typ Video-Ident oder Postident.

## Neue Schnittstelle für das Prepare-Panel

Adresse: `https://pcfmaslrlferrnoopgqn.supabase.co/functions/v1/prepare-results`
Header: `x-api-key: <Schlüssel>` (neuer geheimer Schlüssel, den ich anlege und du im Prepare-Panel einträgst).

```text
POST
{
  "request_id": "<ID, die wir bei der Anfrage mitgeschickt haben>",
  "results": [
    { "auftrag": "Commerzbank-videoident", "success": true,
      "email": "...", "identlink": "https://...", "anosim_link": "https://anosim...?token=..." },
    { "auftrag": "BBVA-videoident", "success": true,
      "username": "...", "password": "...", "email": "...", "anosim_link": "..." },
    { "auftrag": "Santander-postident", "success": true,
      "pdf_base64": "<PDF>", "pdf_name": "postident.pdf" },
    { "auftrag": "DKB-videoident", "success": false, "error": "Kein Termin verfügbar" }
  ]
}
```

- Ergebnisse können in einem Rutsch oder einzeln nacheinander kommen; ein erneutes Senden desselben Auftrags überschreibt den alten Stand (solange er noch nicht gestartet ist).
- Damit das Panel weiß, welche `request_id` gehört, schicken wir sie ab sofort bei jeder neuen Anfrage mit (`request_id` im bisherigen Aufruf an prepare-panel.xyz). Das Prepare-Panel muss sie speichern und zurückschicken. Ältere Anfragen ohne mitgeschickte ID können nicht automatisch zugeordnet werden.
- Antwort: pro Auftrag "gespeichert" oder ein Fehler (z. B. unbekannter Auftrag, fehlende Felder).

## Technische Details

- **DB:** neue Tabelle `verification_request_items` (request_id → verification_requests, vic_id, auftrag_key, verification_id, status `in_bearbeitung`/`bereit`/`fehlgeschlagen`/`gestartet`, error, field_values jsonb, anosim_link, pdf_path, assignment_id, timestamps). Beim Anlegen einer Anfrage werden die Items mit `in_bearbeitung` erzeugt. GRANTs + RLS wie bei `verification_requests` (Admins alles, Caller nur zugewiesene Vics; Schreiben nur service_role).
- **Edge Function `prepare-results`** (`verify_jwt = false`): prüft `x-api-key` gegen Secret `PREPARE_PANEL_API_KEY`, validiert mit Zod je nach Typ, ordnet `auftrag` über `auftragKey()` der Verifikation zu, speichert PDF im Bucket `user-documents` unter `<vic>/requests/<item>.pdf`, Identcode per Regex aus Identlink.
- **Edge Function `start-prepared-item`**: prüft Admin bzw. zuständigen Caller (`_shared/vicAccess.ts`), legt bei Bedarf `phone_numbers` (Token aus Anosim-Link, Marke des Vics) an, erstellt `verification_assignments` mit `field_values` (email, identlink, identcode, username, password), verschiebt/verknüpft das PDF als `user_documents`, setzt Item auf `gestartet`, löst `send-assignment-sms` und Telegram `assignment_created` aus. Serverseitig, damit Zugangsdaten nicht unnötig im Browser landen und Doppel-Starts verhindert werden.
- **`request-verifications`**: schickt zusätzlich `request_id` mit und legt die Items an.
- **Frontend:** `RequestVerificationsSection.tsx` bekommt die Vic-Karten (Gruppierung der Items pro Vic, Logos über `VerificationLogo`, "Starten"-Knopf mit Ladezustand); bisherige Anfrageliste bleibt darunter.
- Das "Vorbereiten und Starten" aus "vic-automation" (1. Arbeitstag) schaue ich mir beim Bauen an und übernehme dessen Aufbau, soweit er passt. Am Prepare-Panel selbst ändere ich nichts; die Anbindung dort (ID speichern, Ergebnisse senden) musst du in dem Projekt einbauen. Ich liefere dir dafür eine fertige Beschreibung.
- Test: Vitest für Identcode-Extraktion und Auftrags-Zuordnung; Deno-Test, dass `prepare-results` ohne Schlüssel 401 liefert und falsche Felder abgelehnt werden.
