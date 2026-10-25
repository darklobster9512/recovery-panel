# Seiten mit 20 Einträgen, Seitenwechsel und Suche

## Was sich ändert

Jede Seite zeigt höchstens 20 Einträge. Unten gibt es eine Leiste mit „Zurück / Seite X von Y / Weiter“ und die Anzeige „21–40 von 312“. Wenn sich Suche oder Filter ändern, springt die Liste zurück auf Seite 1.

| Seite | 20 pro Seite + Seitenwechsel | Neue Suchleiste |
|---|---|---|
| /admin/leads | ja | gibt es schon (Name, E-Mail, Telefon) |
| /admin/vics | ja | gibt es schon, bleibt so |
| /admin/termine | ja | – |
| /admin/verifikationen → Zuweisungsverlauf | ja | Nutzer, E-Mail, Auftrag |
| /admin/ueberpruefung | ja | Nutzer, Auftrag |
| /admin/dokumente | ja (pro Nutzer/Auftrag-Gruppe) | – |
| /admin/telefonnummern | ja | Nummer / Token |
| /admin/livechat | die letzten 20 Chats + Button „Weitere anzeigen“ (+20) | die Suche findet alle Chats, auch die noch nicht angezeigten |

Suche und Filter laufen immer über alle Einträge. Erst danach wird die Liste auf Seiten aufgeteilt, damit Treffer auf späteren Seiten nicht verloren gehen.

## Technische Details

- Neuer gemeinsamer Hook `usePagination(items, pageSize = 20)` gibt `pageItems`, `page`, `setPage` und `totalPages` zurück und setzt die Seite zurück, wenn sich die Länge der Liste ändert.
- Neue Komponente `TablePagination` auf Basis von shadcn `pagination`: Zurück/Weiter, Seitenzahl und Bereichsangabe; bei nur einer Seite wird sie ausgeblendet.
- Die Daten werden weiterhin komplett geladen und im Browser gefiltert (die Datenmengen sind klein). Dadurch bleiben die bestehenden Abfragen, die Echtzeit-Aktualisierung und das Verhalten der Filter unverändert.
- Bearbeitete Dateien: `AdminLeads.tsx`, `AdminVics.tsx`, `AdminAppointments.tsx`, `AdminAssignmentHistory.tsx` (Suche über Vic-Name/E-Mail und Auftragstitel), `AdminReview.tsx`, `AdminDocuments.tsx`, `AdminPhoneNumbers.tsx`, `AdminLivechat.tsx` (`visibleCount`-State, Start bei 20, Button erhöht um 20; bei aktiver Suche wird die gefilterte Gesamtliste angezeigt).
- Keine Änderungen an der Datenbank.
