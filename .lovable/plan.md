# Verfasser in der Telegram-Meldung "Neue Vic-Notiz"

## Was sich ändert
Die Telegram-Meldung bei einer neuen Vic-Notiz zeigt künftig, wer die Notiz geschrieben hat, z. B.:

```text
📌 Neue Vic-Notiz
👤 Petra Textor
📧 petra@...
✍️ Von: Max Müller (Caller)

"Notiztext..."
```

Die Rolle steht in Klammern dabei (Caller, Manager oder Admin), damit man es auch bei Admin-Notizen erkennt.

## Technische Details
- `telegram-notify`: bei `vic_note_added` den Namen des eingeloggten Absenders serverseitig aus `profiles` (Vor-/Nachname, sonst E-Mail) und die Rolle aus `user_roles` laden und als `author_name` / `author_role` in den Payload setzen. Serverseitig, damit der Name nicht vom Browser vorgegeben werden kann.
- `_shared/telegram.ts`: im Fall `vic_note_added` die Zeile `✍️ Von: <Name> (<Rolle>)` ergänzen.
- `telegram-notify` neu deployen. Keine Änderung an Datenbank oder Oberfläche.
