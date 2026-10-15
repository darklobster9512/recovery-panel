# Telegram-Benachrichtigungen – Ursache finden

## Status aus der Prüfung

- Bot-Token funktioniert: `getMe` antwortet mit `recovery0209bot`, Testnachricht an die Gruppe „Recovery Aktivitäten" (`-1004290827615`) kommt sofort an.
- Chat ist in der DB korrekt eingetragen, alle 16 Event-Abos sind `enabled = true`.
- `telegram-notify` wird laut Edge-Logs regelmäßig nur gebootet und beendet – es ist aber nicht sicher erkennbar, ob tatsächlich Anfragen reinkommen (die Logs zeigen hier nur Boot/Shutdown).

Fazit: Telegram selbst, Token und Zielchat sind nicht das Problem. Also werden entweder die auslösenden Stellen nicht erreicht, oder sie laufen durch, ohne zu senden.

## Vorgehen

1. **Nachweis sammeln, welche Events heute wirklich passiert sind.** Für jedes Event, das normalerweise eine Telegram-Meldung auslöst, in der DB prüfen, ob es heute (UTC) überhaupt neue Zeilen gab:
   - Lead-Notizen, Vic-Notizen, Dokument-Uploads
   - Zuweisungen angelegt/abgeschlossen
   - Weitergeleitete SMS (`verification_assignments.forwarded_sms` Änderungen heute, bzw. seven.io-Historie), Anosim-SMS-Erkennung
   - Neue Vic-Konten, KYC-Extraktionen, Chat-Nachrichten, Termine, To-Dos, Kontaktanfragen
2. **Edge-Function-Logs gezielt durchsuchen.** Für jede Funktion, die direkt sendet (`forward-tan-sweep`, `anosim-proxy`, `extract-id-data`, `create-user`, `contact-submit`, `telegram-notify`), nach „Telegram send failed", „no_subscribers", „sub_error" und sonstigen `console.error`-Spuren suchen.
3. **End-to-End Live-Test aus der App.** Einen echten Trigger auslösen (z. B. Test-Nachricht aus `/admin/telegram` sowie eine echte Lead-Notiz hinzufügen) und direkt danach `telegram-notify`-Logs lesen. So sehen wir, ob die Anfrage ankommt, ob sie 2xx liefert und ob die Nachricht in Telegram landet.
4. **Ergebnis einordnen.** Je nachdem, wo die Spur abreißt, einen gezielten Fix-Plan nachreichen – z. B.:
   - App ruft `telegram-notify` nicht mehr auf (Auth-/Session-Problem im Browser): dann an der aufrufenden Stelle fixen.
   - `telegram-notify` antwortet 401/403: Claims/Rollen-Prüfung anpassen.
   - Edge-Functions laufen, aber Chat-IDs/Formatter werfen: dann in `_shared/telegram.ts` nachbessern.
   - Trigger (z. B. `anosim-proxy` oder Sweep) finden keine neue SMS: dann liegt es nicht an Telegram, sondern am Upstream.

## Nicht Teil dieses Plans

- Noch keine Code-Änderungen. Erst wenn die konkrete Fehlerquelle feststeht, mache ich einen zweiten Plan mit dem exakten Fix.
