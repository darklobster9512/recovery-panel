# Kontaktformular der Berthold-Landingpage -> /admin/anfragen

## Bestand
Es gibt schon einen öffentlichen Empfänger `contact-submit` (ohne Login, Telegram-Meldung). Er speichert aber keine Marke. Anfragen landen deshalb ohne Zuordnung und werden nicht nach dem Branding-Wechsel gefiltert.

## URL
```text
POST https://pcfmaslrlferrnoopgqn.supabase.co/functions/v1/contact-submit
Content-Type: application/json
```

## Beispiel-JSON
```json
{
  "first_name": "Max",
  "last_name": "Mustermann",
  "email": "max@example.de",
  "phone": "+49 170 1234567",
  "topic": "Krypto-Betrug",
  "damage_amount": "25.000",
  "message": "Ich wurde über eine Trading-Plattform betrogen ...",
  "source": "berthold-partner.de",
  "brand_domain": "berthold-partner.de"
}
```
Pflichtfelder: first_name, last_name, email, topic, message. Antwort: `{ "ok": true, "id": "..." }`, bei Fehlern 400 mit Liste der Pflichtfelder.

## Änderungen
1. `contact_requests` bekommt eine Marken-Spalte. Bestehende Anfragen werden Korte & Partner zugeordnet.
2. `contact-submit` ordnet die Marke über `brand_domain` zu. Fallback ist die Herkunftsseite (Origin/Referer), danach Korte. Fremde Werte werden ignoriert.
3. `/admin/anfragen` filtert nach der aktiven Marke in der Sidebar.
4. Die Telegram-Meldung zeigt die Marke an, wie bei den anderen Meldungen.
5. Zum Testen schicke ich eine Anfrage, prüfe sie unter Berthold und lösche sie danach wieder.

Das Formular auf der Landingpage muss im Projekt berthold-recovery selbst umgestellt werden. Dafür nimmst du die URL und das JSON oben. Von hier aus kann ich dort nichts ändern.
