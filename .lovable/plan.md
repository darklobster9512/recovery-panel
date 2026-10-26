# Telegram-Nachricht bei übertragenen Verifikationen

Sobald das externe Panel Ergebnisse an `prepare-results` schickt, geht eine Telegram-Nachricht raus. Nur wenn mindestens ein Auftrag erfolgreich übertragen wurde.

## Inhalt der Nachricht
```text
✅ Verifikationen bereit
Branding: Berthold & Partner
Vic: Max Mustermann
Anwalt: Dr. Erika Beispiel   (oder "nicht zugewiesen")
Erfolgreich übertragen:
• Commerzbank – Video-Ident
• DKB – Video-Ident
```
Fehlgeschlagene Aufträge werden nicht aufgeführt. Die Brandings-Zeile wird nicht doppelt angehängt.

## Wer bekommt sie
Neues Ereignis „Verifikationen bereit“ unter /admin/telegram, das man pro Chat ein- und ausschalten kann (wie die anderen). Bestehende Chats, die schon „Auftrag zugewiesen“ abonniert haben, werden automatisch auch dafür eingeschaltet, damit es sofort ankommt.

## Technische Details
- Migration: neuen Wert `verifications_prepared` zum Event-Typ hinzufügen; Abos für Chats mit `assignment_created` kopieren.
- `_shared/telegram.ts`: Event + `formatMessage`-Fall; Brandings-Suffix für dieses Event überspringen (steht schon im Text).
- `prepare-results/index.ts`: erfolgreiche Aufträge sammeln, Vic-Profil (Name, `branding_id`, zugewiesener Caller) separat laden, Caller-Name und Brandname laden, Bank-Namen aus `verifications`; Versand im Hintergrund, Fehler blockieren die Antwort nicht.
- `AdminTelegram.tsx`: Ereignis in der Liste ergänzen. Deploy `prepare-results`.
