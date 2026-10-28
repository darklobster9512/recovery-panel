# Neues Label „Fakeshop“ für Leads

In der hochgeladenen Datei heißen Kampagne, Anzeigengruppe und Anzeige „fs1“. Solche Leads bekommen beim Import künftig das Label **Fakeshop** statt Kanzlei oder Europol.

## Erkennung
- Steht in campaign_name, adset_name oder ad_name ein Wert, der mit „fs“ beginnt (fs1, fs2, …) oder „fakeshop“ enthält, wird der Lead als Fakeshop markiert.
- Diese Prüfung kommt vor Europol/Kanzlei, damit z. B. Texte mit „Europol“ in der Beschreibung nichts ändern (die Erkennung nutzt ohnehin nur die Kampagnenfelder).

## Anzeige
- Neues Badge „Fakeshop“ (eigene Farbe, z. B. Lila/Rosa) überall dort, wo heute Kanzlei/Europol erscheint: Leads-Liste, Vic-Detail, Filter, Dashboard-Diagramm „Vics nach Status“.
- Filter auf /admin/leads und /admin/vics bekommen die Option „Fakeshop“.

## Technisch
- `src/lib/leads.ts`: `LeadCampaign` um `"fakeshop"` erweitern, `CAMPAIGN_META` ergänzen, `detectCampaign` vorn um `/^fs\d*/` bzw. „fakeshop“ erweitern.
- Stellen anpassen, die nur europol/kanzlei kennen (Dashboard, Auth/Vic-Dashboard-Texte, Diagramm) — Fakeshop-Vics nutzen dort dieselbe Darstellung wie Kanzlei.
- `leads.campaign` ist Text, keine DB-Änderung nötig.
- Kleiner Test für `detectCampaign` („fs1“ → fakeshop).
- Bereits importierte fs1-Leads werden optional per Datenupdate auf „fakeshop“ gesetzt.
