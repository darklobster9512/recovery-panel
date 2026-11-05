Verifikationen von Klaudia Keller löschen

Gefunden (eine Anfrage mit 6 Aufträgen):
- Bereit: DKB Video-Ident, BBVA Video-Ident, Consorsbank Video-Ident
- Zugewiesen (gestartet): Commerzbank Video-Ident, Deutsche Bank Video-Ident
- Fehlgeschlagen: Santander Post-Ident (bleibt, außer gewünscht)

Was gelöscht wird:
1. Die zwei Zuweisungen Commerzbank und Deutsche Bank bei Klaudia (inkl. zugehöriger hochgeladener Dateien zu diesen Zuweisungen, falls vorhanden).
2. Die 5 Anfrage-Einträge (3 bereit, 2 gestartet).
3. Der fehlgeschlagene Santander-Eintrag bleibt; die Anfrage selbst bleibt bestehen, damit dieser sichtbar ist. Dadurch können die 5 Banken neu angefragt werden.

Technisch: DELETE auf verification_request_items (5 IDs), user_documents mit assignment_id der 2 Zuweisungen, verification_assignments (2 IDs). auftraege-Array der Anfrage 9ce23c8d auf ['Santander-postident'] kürzen, damit die Banken nicht als "bereits angefragt" gesperrt sind.
