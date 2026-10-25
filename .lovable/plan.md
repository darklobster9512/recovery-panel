# Diagramm „Vics nach Status“

Das Diagramm „Leads nach Status“ wird zu „Vics nach Status“. Es zeigt pro Vic-Status (wie in der Vics-Liste) die Anzahl der Vics, getrennt nach Kanzlei und Europol (Herkunft des Vics). Vics ohne Herkunft werden als eigene Farbe „Ohne Kampagne“ gezeigt. „Alle“ führt zu /admin/vics.

## Technische Details
- `AdminDashboard.tsx`: Statusliste aus `VIC_STATUS_OPTIONS` (`VicStatusSelect.tsx`).
- Abfrage `profiles` (id, member_status, source_lead_id), ohne Mitarbeiter (admin/caller per `user_roles`); Kampagne über separate Abfrage `leads` (id, campaign) für die `source_lead_id`s – keine Joins.
