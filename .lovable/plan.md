# Bereit zum Start: gestartete Aufträge bleiben sichtbar (orange)

## Verhalten
- Nach „Starten“ bleibt der Auftrag auf der Karte und im Popup sichtbar, mit **orangenem Rand** um das Bank-Logo und dem Badge „Zugewiesen“ (im Popup statt des Start-Knopfs).
- Er bleibt orange, solange der Vic ihn bearbeitet (Zugewiesen, In Bearbeitung, Abgeschlossen).
- Sobald der Auftrag „In Überprüfung“ ist (oder schon genehmigt bzw. abgelehnt), verschwindet er von der Karte.
- Die ganze Karte verschwindet erst, wenn kein Auftrag mehr bereit (grün) oder zugewiesen (orange) ist. Nicht mögliche Aufträge (rot) halten die Karte nicht offen.
- Farben: grün = bereit, orange = zugewiesen, rot = nicht möglich, ausgegraut = noch in Vorbereitung.

## Technisch
- `PreparedVerificationCards.tsx`: Für Einträge mit `status = "gestartet"` die `assignment_id`s sammeln und den Status aus `verification_assignments` per separater Abfrage laden (keine Joins).
- Filter: gestartete Einträge ausblenden, wenn der Zuweisungsstatus `in_ueberpruefung`, `genehmigt` oder `abgelehnt` ist; sonst mit `border-2 border-warning` und Badge „Zugewiesen“ anzeigen.
- Karte nur zeigen, wenn mindestens ein Eintrag `bereit`, `in_bearbeitung` oder sichtbar gestartet ist.
- Nach dem Start lokal den Status „zugewiesen“ setzen, damit der Auftrag sofort orange wird; regelmäßiges Neuladen (wie bisher) übernimmt Statuswechsel.
