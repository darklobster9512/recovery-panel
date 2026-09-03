# Testleads entfernen

Alle 5 aufgelisteten Leads sind in der Datenbank vorhanden und werden gelöscht.

## Zu löschen (5)
- Javad Ziadkhani — ja-ziadkhani@t-online.de
- Uwe Schemel — uweschemel@gmail.com
- Annette Schmitt — anne.schmitt03@gmail.com
- Fajko Terzic — fajkotrrzic@gmail.com
- Christian Hühn — mcchicken22@hotmail.com

## Technisch
- `profiles.source_lead_id` für diese 5 Leads auf `NULL` setzen (FK-Schutz).
- `lead_notes` und `lead_activity` für die IDs löschen.
- Anschließend die 5 Zeilen aus `leads` löschen.
- Vic-Konten bleiben unverändert.
