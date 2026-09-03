# KYC-Daten aus Personalausweis extrahieren & per Telegram senden

Wenn ein Vic den Personalausweis (Vorder- + Rückseite, Bild oder PDF) hochlädt, werden die Ausweisdaten automatisch per Lovable AI (Gemini Vision) extrahiert und an alle Telegram-Chats geschickt, die das neue Event `kyc_data_extracted` abonniert haben.

## Ablauf

1. Vic lädt in `DocumentUpload.tsx` Vorder- und Rückseite hoch (bestehender Personalausweis-Flow, `kind='personalausweis'`).
2. Nach erfolgreichem Upload beider Dateien ruft der Client die neue Edge Function `extract-id-data` mit den beiden Storage-Pfaden auf (fire-and-forget, kein UX-Blocker).
3. `extract-id-data` erzeugt signierte URLs für beide Dateien, ruft Lovable AI Gateway (`google/gemini-2.5-flash`) mit Tool-Call `extract_id` auf und bekommt strukturierte Felder zurück.
4. Die Function ruft anschließend intern `sendTelegramNotification(..., 'kyc_data_extracted', payload)` auf, sodass alle Chats, die dieses Event aktiviert haben, die Nachricht bekommen.

## Neues Telegram-Event

Enum-Wert `kyc_data_extracted` wird zu `telegram_event` hinzugefügt. In `AdminTelegram.tsx` erscheint er automatisch in der Chat×Event-Matrix als „KYC-Daten verfügbar".

## Nachrichten-Design

```
🪪 <b>Neuer Ausweis verfügbar</b>
👤 Vic: Max Mustermann

<b>Vorname:</b> Max
<b>Nachname:</b> Mustermann
<b>Geburtsname:</b> Schmidt
<b>Geburtsdatum:</b> 01.01.1990
<b>Geburtsort:</b> Hamburg
<b>Straße & Hausnummer:</b> Musterweg 12
<b>PLZ Stadt:</b> 20095 Hamburg
```

Leere Felder werden mit „—" angezeigt.

## Technische Details

- Neue Migration: `ALTER TYPE public.telegram_event ADD VALUE 'kyc_data_extracted';`
- Neue Edge Function `supabase/functions/extract-id-data/index.ts` (verify_jwt = true, ruft Storage mit Service Role für signierte URLs auf). Übernimmt System-Prompt/Tool-Definition aus dem Referenzprojekt, gekürzt auf Ausweisdaten (kein Meldenachweis).
- Formatter in `_shared/telegram.ts` um Case `kyc_data_extracted` erweitert.
- Client (`DocumentUpload.tsx`): Nach erfolgreichem Personalausweis-Upload wird `supabase.functions.invoke('extract-id-data', { body: { user_id, front_path, back_path } })` fire-and-forget aufgerufen; Fehler nur ins Console-Log.
- Vic-Name kommt aus `profiles` (Service-Role Query in der Function).
- Secret `LOVABLE_API_KEY` ist bereits vorhanden.
