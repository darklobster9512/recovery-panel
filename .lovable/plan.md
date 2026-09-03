# Testleads entfernen

Von den 22 aufgelisteten Einträgen finden sich aktuell 7 in der Datenbank. Die übrigen 15 sind nicht (mehr) vorhanden und werden übersprungen.

## Zu löschen (7)
- Besnik Abazi — abazibesnik39@Gmail.com
- Angelika Schur — ajaba1808@gmail.com
- Dor Günni — thomas.deutzen@googlemail.com
- Mantonsi Fabius Mavinga — mantonsifabiusmavinga@gmail.com
- Peppi Vdb. Franz Josef Van den Berg — peppivdb@gmx.de
- Martina Popp — martinapopp1@t-online.de
- Hana Jansky — janskyhana99@gmail.com

## Nicht gefunden (übersprungen)
Heidemann, Purfürst, „O“, Hildebrandt, Stoica, Heuckeroth, König, Müller, Hahn, Petre, Milia, Schweigl, Fast, Hohenbleicher, Trollmann.

## Technisch
- `profiles.source_lead_id` zuvor für diese 7 Leads auf `NULL` setzen (FK-Schutz).
- `lead_notes` und `lead_activity` löschen (FK ist ohnehin `NOT NULL` auf `lead_id`).
- Anschließend die 7 Zeilen in `leads` löschen.
- Vic-Konten bleiben unverändert.
