# Widget-Telefonnummer live über Anosim ziehen

Aktuell liest `webid-ident-lookup` die Telefonnummer aus `field_values.phone` der Zuweisung — dort ist meist nichts hinterlegt, also zeigt das Widget „—“. Die Nummer soll stattdessen live aus der Anosim-API kommen (gleiche Quelle wie `/admin/telefonnummern`) und `+49…` → `0…` formatiert werden.

## Änderung

Datei: `supabase/functions/webid-ident-lookup/index.ts`

- Wenn die aktive Zuweisung ein `phone_number_id` hat, wird sowieso schon der Anosim-Token geladen und `fetchAnosimSms` aufgerufen. Denselben Anosim-Aufruf um das komplette Response-Objekt erweitern (nicht nur `sms`), damit `data.number` verfügbar ist.
- `phone` = `data.number` aus Anosim; Fallback `field_values.phone`, falls Anosim kein `number` liefert.
- Formatierung serverseitig: führendes `+49` (auch mit Leerzeichen/Nullen wie `+49 0`, `+490`) durch `0` ersetzen, alle Whitespaces entfernen. Andere Ländervorwahlen bleiben unverändert.
- Antwortformat bleibt `{ found, email, phone, tan }`.

Kein Widget-Change, keine DB-Änderung, keine neue Function.

## Technische Details

`fetchAnosimSms` wird zu `fetchAnosim` (liefert `{ number, sms }`). Die TAN-Logik bleibt identisch. Redeploy der Function nötig.
