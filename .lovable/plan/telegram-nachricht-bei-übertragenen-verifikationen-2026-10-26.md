# Telegram-Nachricht bei übertragenen Verifikationen

Sobald das externe Panel Ergebnisse an `prepare-results` schickt, geht eine Telegram-Nachricht raus. Nur wenn mindestens ein Auftrag erfolgreich übertragen wurde.

## Inhalt der Nachricht (im Stil der anderen Benachrichtigungen)
```text
🏷️ Berthold & Partner
✅ Verifikationen bereit
👤 Vic: Max Mustermann
📞 Caller: Erika Beispiel   (oder "nicht zugewiesen")
Erfolgreich übertragen:
• Commerzbank – Video-Ident
• DKB – Video-Ident
```
Die Marke steht wie überall oben mit dem Etikett-Emoji (automatisch). Fehlgeschlagene Aufträge werden nicht aufgeführt.

## Wer bekommt sie
Neues Ereignis „Verifikationen bereit“ unter /admin/telegram, pro Chat ein- und ausschaltbar. Chats, die schon „Auftrag zugewiesen“ abonniert haben, werden automatisch auch dafür eingeschaltet.

## Technische Details
- Migration: neuen Event-Wert `verifications_prepared`; Abos von Chats mit `assignment_created` kopieren.
- `_shared/telegram.ts`: Event + `formatMessage`-Fall; Brandzeile über den bestehenden Mechanismus (`vic_id` im Payload).
- `prepare-results/index.ts`: erfolgreiche Aufträge sammeln, Vic-Profil und zugewiesenen Caller separat laden, Bank-Namen aus `verifications`; Versand ohne die Antwort zu blockieren.
- `AdminTelegram.tsx`: Ereignis ergänzen. Deploy `prepare-results`.
