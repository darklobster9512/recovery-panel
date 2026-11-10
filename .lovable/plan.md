# Telegram: SMS- und TAN-Meldungen vollständig machen

## Befund (geprüft)
Die Meldungen "Neue SMS" und "TAN weitergeleitet" entstehen nur in `processAssignmentForward`, und die bricht früh ab, wenn eine Bedingung nicht passt. Der Telegram-Chat ist für beide Ereignisse korrekt eingetragen, der 15-Sekunden-Job läuft (Testlauf: 17 Aufträge geprüft).

Meldungen fehlen deshalb in diesen Fällen:
- **Weiterleitung aus** (`forward_tan_to_vic = false`): Funktion bricht ab, bevor SMS gemeldet werden. Betrifft u. a. mehrere Berthold-Aufträge mit Nummer.
- **SMS-Überwachung aus** (`sms_monitoring_active = false`): gleiches Verhalten, betrifft mehrere Korte-Aufträge.
- **Status nicht "zugewiesen"/"in Bearbeitung"**: sobald der Auftrag z. B. "In Überprüfung" ist, wird nichts mehr gelesen. Spät eintreffende SMS gehen verloren.
- **Vic ohne Handynummer / ohne Nummer-Token**: Abbruch, keine SMS-Meldung.

TAN-Meldung speziell:
- Sie kommt nur, wenn seven.io den Versand bestätigt. Aktuell wertet der Code nur den HTTP-Status aus, nicht den seven.io-Code. Bei ungültigem Schlüssel (Code 900, wie bei Berthold gefunden) ist das Ergebnis unzuverlässig: entweder wird fälschlich "weitergeleitet" gemeldet oder die TAN bleibt unbemerkt hängen.
- Schlägt der Versand fehl, wird die SMS nicht als gesehen markiert und alle 15 Sekunden erneut als "Neue SMS" gemeldet (Spam-Gefahr) – ohne dass jemand erfährt, dass die Weiterleitung scheitert.

## Umsetzung (nach deiner Wahl "Alle mit Nummer")
1. `supabase/functions/_shared/forwardTan.ts` umbauen:
   - SMS-Meldung unabhängig von Weiterleitung, Überwachung und Vic-Handynummer: jede neue SMS auf einer zugewiesenen Nummer wird gemeldet.
   - TAN wird nur an den Vic gesendet, wenn Weiterleitung und Überwachung an sind und der Auftrag noch zugewiesen/in Bearbeitung ist; sonst nur Meldung.
   - Versand mit `sendSevenSms`/`parseSevenResponse` aus `_shared/sevenio.ts` (Code 100 = Erfolg). "TAN weitergeleitet" nur bei echtem Erfolg.
   - Schlägt der Versand fehl: SMS wird trotzdem als gemeldet markiert (kein Dauer-Spam), und es kommt einmal eine Telegram-Meldung "TAN-Weiterleitung fehlgeschlagen" mit Grund (z. B. "API-Schlüssel ungültig") und Code.
2. `forward-tan-sweep`: Kandidaten erweitern auf alle Aufträge mit Nummer, Status zugewiesen / in Bearbeitung / in Überprüfung und jünger als 7 Tage (Limit 200), unabhängig von den beiden Schaltern.
3. `telegram.ts`: neues Ereignis `tan_forward_failed` mit Text und gleichem Chat-Abo wie `tan_forwarded_to_vic` (Abo-Zeile per Migration kopieren, damit es sofort ankommt).
4. Test in `src/test`: Regeln, wann gemeldet und wann weitergeleitet wird (Weiterleitung aus = nur Meldung; seven-Code 900 = keine "weitergeleitet"-Meldung, aber Fehlermeldung).
5. Edge Functions `forward-tan-sweep` und `anosim-proxy` neu deployen und Sweep einmal anstoßen.

## Offen / Hinweis
- Der Berthold-seven.io-Schlüssel ist laut früherer Prüfung ungültig (Code 900). Solange er nicht korrigiert ist, kann Berthold keine TAN an Vics weiterleiten; ab jetzt meldet es Telegram wenigstens.
- Ob Telegram-Nachrichten im Chat wirklich ankommen, prüfe ich nach dem Umbau mit einem Sweep-Lauf, soweit neue SMS vorliegen.
