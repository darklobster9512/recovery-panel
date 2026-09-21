# Caller sehen Lead-Herkunft und Kampagnen-Badge bei Vics

## Ursache (bestätigt)
Auf der Vic-Detailseite lädt der Client `leads` und `lead_notes` per RLS. Die aktuellen Caller-Policies erlauben Zugriff nur, wenn `leads.assigned_caller_id = auth.uid()`. Der Herkunfts-Lead eines Vics hat dieses Feld aber i.d.R. nicht auf den Caller gesetzt (Zuweisung erfolgt am Vic-Profil, nicht am Lead). Ergebnis: Caller bekommen leere Antworten und sehen weder Schadenshöhe/Vorfall noch Notizen.

Zusätzlich wird in der Vic-Detailseite kein Kampagnen-Badge (Europol/Kanzlei) gerendert, obwohl das Feld `leads.campaign` existiert.

## Umsetzung

1. **RLS erweitern** (Migration)
   - Neue SELECT-Policy auf `public.leads` für Caller: erlaubt lesen, wenn ein Profil existiert mit `profiles.source_lead_id = leads.id` UND `profiles.assigned_caller_id = auth.uid()` UND `has_role(auth.uid(),'caller')`.
   - Neue SELECT-Policy auf `public.lead_notes` für Caller analog über die Verknüpfung `leads → profiles.source_lead_id`.
   - Bestehende Policies bleiben unverändert.

2. **Kampagnen-Badge in Vic-Detailseite**
   - In `src/components/AdminVicDetail.tsx` in der „Herkunft: Lead"-Card neben dem Lead-Status das bestehende `CampaignBadge` anzeigen, wenn `sourceLead.campaign` gesetzt ist.

## Nicht im Scope
- Keine Änderung am Datenmodell.
- Keine Änderung an Admin-Ansichten oder anderen Lead-Rechten.
