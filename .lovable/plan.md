# WebID Demo-Widget + Ident-Lookup Edge Function

Wir übernehmen aus dem Referenzskript (v17) nur das schwebende „Demo Daten"-Widget in `webid_skript_clean.sh` und legen eine neue Edge Function `webid-ident-lookup` an, die dem Widget live Email, Telefon und TAN zum aktuellen WebID-Vorgang liefert. Textersetzungen, Overlay, Badge, Topbar aus v17 bleiben draußen — Originalseite bleibt sauber.

## Was das Widget zeigt

Draggable Card oben rechts (mobil unten fixiert), speichert Position in localStorage:
- Email
- Telefonnummer (formatiert `+49…` → `0…`)
- TAN (groß, monospace; grün wenn eingegangen, mit 3-Sekunden-Poll-Timer)

Das Widget pollt alle 3s `GET {LOOKUP_URL}?url={location.href}` und übernimmt Werte sobald `found:true`. Sobald eine TAN geliefert wurde, stoppt der Poll.

## Edge Function `webid-ident-lookup`

- Public (kein Auth-Header nötig, damit die WebID-Seite direkt fetchen kann), CORS `*`.
- Input: `?url=<aktuelle WebID-URL>`.
- Ableitung der Vorgangsnummer: letzte 9 Ziffern nach `/aid/` im Pfad (Fallback: erste 9-stellige Zahl in der URL). Ist identisch mit unserem gespeicherten `identcode`.
- Verwendet Service-Role-Client (Read-only), sucht in `verification_assignments`:
  - `field_values->>'identcode' = <code>` ODER `field_values->>'identlink'` enthält den Code
  - nur aktive Zuweisungen (`status != 'abgeschlossen'`), neueste zuerst
- Antwort:

```json
{ "found": true, "email": "…", "phone": "+49…", "tan": "123456" }
```

- `email`, `phone` kommen direkt aus `field_values`.
- `tan`: neuster Code aus `forwarded_sms[].code` der Zuweisung; wenn dort leer, aus `hidden_sms`/eingegangenen SMS des zugehörigen `phone_numbers.token` via Anosim-API (im Server, Token nie ans Widget) — dabei Regex `WebID Identification TAN\s*\/\s*Code:\s*(\d{4,8})`.
- Fehlt Vorgang / kein Match: `{ "found": false }` (Status 200, damit Widget einfach weiterpollt).

Kein Schreiben in DB, keine neuen Tabellen, keine Änderungen an bestehenden Functions.

## Änderungen an `webid_skript_clean.sh`

- Neue Variable `LOOKUP_URL="https://ssxqmhnpnxnwaqquswwv.supabase.co/functions/v1/webid-ident-lookup"`.
- `proxy_buffer_size 256k; proxy_buffers 8 256k; proxy_busy_buffers_size 512k;` anheben (nötig für sub_filter).
- In `location /` neuen Block:
  - `sub_filter_types text/html;`
  - `sub_filter_once off;`
  - `sub_filter "<head>" "<head><style>…nur #sim-widget CSS…</style>";`
  - `sub_filter "</html>" "<script>…Widget-Injector…</script></html>";`
- Kein Overlay, kein Badge, kein Topbar, keine Text-Rewrites — nur das Widget.
- Reload statt Restart (`systemctl reload nginx`), damit SSH-Session nicht droppt.

## Technische Details

Dateien:
- neu: `supabase/functions/webid-ident-lookup/index.ts`
- edit: `webid_skript_clean.sh` (im Repo-Root, sofern vorhanden — sonst als neue Datei bereitgestellt)

Keine DB-Migration, keine RLS-Änderung, keine Frontend-Anpassung im /admin-Panel.

Verifikation:
- `tsgo --noEmit` auf Function.
- Manueller `curl "…/webid-ident-lookup?url=https://webid.korte-kanzlei.de/service/qa/cn/000347/aid/694977088"` gegen eine echte Test-Zuweisung, um `found/email/phone/tan` zu prüfen.
