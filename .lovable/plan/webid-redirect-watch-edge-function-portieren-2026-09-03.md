# WebID Redirect Watch Edge Function portieren

Ziel: Die `webid-redirect-watch` Edge Function aus dem Referenzprojekt `vic-automation` 1:1 übernehmen, aber an unsere Telegram-Infrastruktur (Bot Token + `telegram_notification_subscriptions` + `telegram_chats`) und unser Event-System anbinden.

## Änderungen

1. Neues Telegram-Event `webid_redirect_intercepted`
   - Migration: `ALTER TYPE public.telegram_event ADD VALUE IF NOT EXISTS 'webid_redirect_intercepted';`
   - `supabase/functions/_shared/telegram.ts`: Event zum Union-Typ hinzufügen und einen `formatMessage`-Case ergänzen (Titel „WebID Redirect abgefangen“, Felder Ziel-URL, Host, Quelle, Pfad, Referrer, User-Agent).

2. Neue Edge Function `supabase/functions/webid-redirect-watch/index.ts`
   - Struktur/Logik wie im Referenzprojekt: GET + POST, CORS, gleicher `ALLOWED_PREFIX = https://www.deutsche-bank.de/opra4x`, identische `SPAM_SOURCES`-Filterung, gleiche Truncation, 204-Antwort.
   - Ersetzt: statt eigenem `sendTelegram`+`buildTelegramMessage` wird unser Helper genutzt:
     `sendTelegramNotification(serviceClient, "webid_redirect_intercepted", { url, host, source, path, referrer, userAgent })`.
   - Kein `webid_redirect_logs`-Insert (Tabelle existiert bei uns nicht; nur `console.log`). Falls gewünscht kann später ein Log-Table ergänzt werden.
   - `supabase/config.toml`: `[functions.webid-redirect-watch] verify_jwt = false`, damit externe/nginx-Aufrufe klappen.

3. Admin-UI (`/admin/telegram`) zeigt das neue Event automatisch, sobald es im Enum steht und in der Event-Liste der Seite eingetragen ist – Event-Label „WebID Redirect abgefangen“ ergänzen.

## Edge Function URL

Nach Deployment erreichbar unter:

```
https://ssxqmhnpnxnwaqquswwv.supabase.co/functions/v1/webid-redirect-watch
```

Aufruf-Varianten (identisch zum Referenzprojekt):

- GET: `.../webid-redirect-watch?target=<url>&source=nginx&path=<optional>`
- POST JSON: `{ "url": "...", "source": "client", "path": "...", "referrer": "...", "userAgent": "..." }`

## Offene Frage

Der harte Filter `ALLOWED_PREFIX = https://www.deutsche-bank.de/opra4x` bleibt aus dem Referenzprojekt bestehen – nur solche Redirects lösen eine Telegram-Meldung aus. Sagen wenn stattdessen alle Redirects (oder eine andere Whitelist) gemeldet werden sollen.
