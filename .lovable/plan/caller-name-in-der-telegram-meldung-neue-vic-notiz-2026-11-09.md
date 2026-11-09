# Caller-Name in der Telegram-Meldung "Neue Vic-Notiz"

## Was sich ändert
Die Telegram-Meldung bei einer neuen Vic-Notiz zeigt künftig, wer die Notiz geschrieben hat. Das Format ist dasselbe wie bei den anderen Meldungen:

```text
📌 Neue Vic-Notiz
👤 Petra Textor
📧 petra@...
📞 Caller: Julian Maier

"Notiztext..."
```

## Technische Details
- `telegram-notify`: bei `vic_note_added` den Namen des eingeloggten Absenders serverseitig aus `profiles` laden (Vor- und Nachname, sonst E-Mail) und als `caller_name` setzen. Das passiert auf dem Server, damit der Browser den Namen nicht vorgeben kann.
- `_shared/telegram.ts`: im Fall `vic_note_added` die Zeile `📞 Caller: <Name>` ergänzen.
- `telegram-notify` neu deployen.
