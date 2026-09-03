# Testleads entfernen

Alle Einträge aus der Lead-Verwaltung löschen, da es sich nur um Testdaten handelt.

## Umfang
- Alle Zeilen aus `lead_notes` entfernen
- Alle Zeilen aus `lead_activity` entfernen
- Alle Zeilen aus `leads` entfernen
- `profiles.source_lead_id` auf NULL setzen, damit bestehende Vics ihre Lead-Referenz sauber verlieren (Vic-Konten selbst bleiben unberührt)

## Hinweis
Aktion ist nicht umkehrbar. Kein Code, keine Schema-Änderung, nur Datenlöschung.
