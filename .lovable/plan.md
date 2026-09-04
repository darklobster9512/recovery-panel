In `src/components/AdminVics.tsx` die Vics-Tabelle um eine **Status**-Spalte erweitern, die anzeigt, ob ein Vic **Aktiv** oder **In Bearbeitung** ist.

Änderungen:
1. Interface `VicUser` um `member_status` ergänzen.
2. `fetchUsers` erweitert, um `member_status` aus `profiles` abzufragen.
3. Neue Tabellenspalte **Status** zwischen **Caller** und **Erstellt am** einfügen (Header + Body).
4. In der Zeile den Status als `Badge` darstellen:
   - `aktiv` → grüne Badge mit Text „Aktiv"
   - `in_bearbeitung` → gelbe/amber Badge mit Text „In Bearbeitung"
   - sonst → „–"
   - Styling an `AdminVicDetail.tsx` anlehnen (`bg-emerald-100 text-emerald-800` / `bg-amber-100 text-amber-800`).
5. Keine Datenbank-Änderung nötig, da `member_status` bereits existiert.

Dateien: nur `src/components/AdminVics.tsx`.