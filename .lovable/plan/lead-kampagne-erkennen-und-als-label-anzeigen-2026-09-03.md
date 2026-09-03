# Lead-Kampagne erkennen und als Label anzeigen

Beim CSV-Import wird pro Zeile die Kampagne erkannt (`euro` → `europol`, `korte` → `kanzlei`) und als Label neben dem Namen in Tabelle und Detailseite dargestellt.

## Datenbank

Neues Feld `campaign` (`text`, nullable) auf `public.leads`. Werte: `europol` | `kanzlei` | `NULL` (unbekannt). Keine weiteren Änderungen an RLS/Grants nötig.

## Import-Logik (`src/lib/leads.ts`)

- `FIELD_MATCHERS` um `campaign: ["campaignname", "adname", "adsetname"]` erweitern.
- Neue Helper `detectCampaign(raw)`: liest `campaign_name`, sonst `ad_name`/`adset_name`; lowercased. Enthält der Wert `euro` → `europol`, enthält `korte` → `kanzlei`, sonst `null`.
- `ParsedLead` bekommt `campaign: 'europol' | 'kanzlei' | null`.
- Import-Vorschau: eine zusätzliche Spalte „Kampagne" mit dem Label.

## UI

- Neue Komponente `CampaignBadge` (klein, farbig): `Europol` = blau, `Kanzlei` = gold/navy passend zum Look.
- `AdminLeads.tsx`: Badge direkt hinter dem vollen Namen in der Tabelle.
- `AdminLeadDetail.tsx`: Badge in der Kontakt-Card neben dem Namen.

## Nicht im Scope

- Keine Änderungen an Notizen, Aktivitätsprotokoll oder Nutzeranlage aus Lead.
- Keine nachträgliche Backfill-Migration bestehender Leads (Feld bleibt `NULL`, bis neu importiert wird).
