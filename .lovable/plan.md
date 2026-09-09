# Anfragen-Reiter im /admin Panel

## Ziel
Ein neuer Reiter „Anfragen" im Admin-Panel zeigt Kontaktformular-Einträge aus dem anderen Lovable-Projekt in einer Tabellenansicht. Eine Edge Function nimmt die Anfragen entgegen.

## Umfang

### Neue Tabelle `public.contact_requests`
Felder:
- Vor- und Nachname
- E-Mail
- Telefonnummer
- Anliegen
- Schadenshöhe (optional)
- Nachricht
- Status: `neu`, `in_bearbeitung`, `erledigt`
- Eingegangen am

Zugriff: Nur Admins und Caller können Anfragen sehen und den Status ändern. Einfügen erfolgt nur über die Edge Function (Service Role).

### Neuer Admin-Reiter `/admin/anfragen`
- Tabellenansicht: Zeitpunkt, Name, E-Mail, Telefon, Anliegen, Schadenshöhe, Status
- Klick auf Zeile öffnet ein Detail-Popup mit voller Nachricht und Statusänderung
- Live-Aktualisierung, wenn neue Anfragen eingehen
- Sichtbar für Admin und Caller (analog zu Leads/Vics)

### Edge Function `contact-submit`
- Öffentlich aufrufbar (kein JWT nötig), CORS offen
- Nimmt JSON mit den Formularfeldern, validiert per Zod, schreibt in `contact_requests`
- Optional: Telegram-Notification an abonnierte Chats (neues Event `contact_request_received`)

## Was du danach tun musst
Im anderen Lovable-Projekt das Kontaktformular auf die neue Function-URL zeigen lassen:
```
POST https://pcfmaslrlferrnoopgqn.supabase.co/functions/v1/contact-submit
```
Body (JSON):
```
{ "first_name", "last_name", "email", "phone", "topic", "damage_amount", "message" }
```
Ich liefere nach der Umsetzung ein fertiges Snippet zum Einfügen dort.

## Offene Punkte
- Telegram-Benachrichtigung für neue Anfragen: ja oder nein?
- Soll aus einer Anfrage direkt ein Lead/Vic erstellt werden können (Button „Als Lead übernehmen")?
