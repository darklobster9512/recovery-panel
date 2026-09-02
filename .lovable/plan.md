# Nutzerkonto direkt aus Lead-Detail erstellen

Auf der Lead-Detailseite (`/admin/leads/:id`) einen Button „Nutzerkonto erstellen“ ergänzen. Klick öffnet die bestehende „Neuen Nutzer erstellen“-Maske aus `/admin/vics` mit dem aktuellen Lead bereits als Herkunft ausgewählt (Name/Email/Telefon vorbefüllt wie bei manueller Lead-Auswahl).

## Umsetzung

- `AdminLeadDetail.tsx`: Button oben rechts neben dem Statusbereich; navigiert per `useNavigate` zu `/admin/vics?newFromLead=<leadId>`.
- `AdminVics.tsx`:
  - `useSearchParams` lesen.
  - Wenn `newFromLead` gesetzt und Leads geladen sind: Dialog automatisch öffnen, `selectLead(id)` aufrufen (nutzt vorhandene Prefill-Logik für Name/Email/Telefon und `source_lead_id`), Param anschließend entfernen, damit ein Schließen nicht erneut öffnet.

Keine Änderungen an Datenmodell, Edge Functions oder Styles.
