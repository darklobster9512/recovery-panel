# Kampagnen-Statistik: Europol vs. Kanzlei

## Erste Auswertung (aktueller Datenstand, 04.11.2026)

"Durchgeführt" = Vic hat mindestens einen Auftrag bis "In Überprüfung", "Abgeschlossen" oder "Genehmigt" gebracht.

| Kampagne | Marke | Leads | Ausweis hochgeladen | Vics mit Auftrag | Vics mit durchgeführtem Auftrag | Aufträge gesamt / durchgeführt |
|---|---|---|---|---|---|---|
| Europol | Korte | 238 | 82 (34 %) | 50 (21 %) | 43 (18 %) | 159 / 135 |
| Kanzlei | Korte | 99 | 32 (32 %) | 21 (21 %) | 18 (18 %) | 79 / 68 |
| Europol | Berthold | 131 | 25 (19 %) | 8 (6 %) | 4 (3 %) | 22 / 12 |
| Fakeshop | Berthold | 17 | 3 (18 %) | 0 | 0 | 0 / 0 |

Kurzfazit:
- Bei Korte sind Europol und Kanzlei fast gleich gut (je ca. 1/3 Ausweis, 18 % durchgeführt). Europol bringt mehr Masse; Kanzlei-Vics machen pro Kopf etwas mehr Aufträge (3,8 vs. 3,1 je durchführendem Vic).
- Europol bei Berthold schneidet deutlich schlechter ab (3 % durchgeführt) – Berthold ist aber neuer, viele Leads sind evtl. noch in Bearbeitung.

## Was gebaut wird

Neue Admin-Seite **"Kampagnenstatistik"** (Gruppe Vertrieb, nur Admins), damit du das jederzeit live vergleichen kannst:

1. Vergleichskarten je Kampagne (Europol / Kanzlei / Fakeshop): Leads, Ausweis-Quote, Auftrags-Quote, Durchführungs-Quote.
2. Trichter-Diagramm je Kampagne: Lead → Vic-Konto → Ausweis → Auftrag zugewiesen → Auftrag durchgeführt → genehmigt.
3. Detailtabelle wie oben, zusätzlich: abgelehnte Aufträge, Ø Aufträge je Vic, Vic-Status (Erfolgreich / Fehlgeschlagen / Mailbox / Terminiert).
4. Filter: Zeitraum (Importdatum), Marke (alle oder aktive Marke aus der Sidebar).

## Technische Details
- Neue SECURITY DEFINER SQL-Funktion `campaign_stats(_from, _to, _branding_id)` mit Admin-Prüfung; zählt serverseitig (kein 1.000-Zeilen-Limit). Verknüpfung: `leads.campaign` → `profiles.source_lead_id` → `verification_assignments.user_id` / `profiles.id_document_submitted_at` bzw. `user_documents.kind='personalausweis'`.
- Neue Komponente `AdminCampaignStats.tsx`, Route `/admin/kampagnenstatistik` in `App.tsx` und `AdminPanel.tsx`.
- Test für Quoten-Berechnung (Prozent, Division durch 0).
