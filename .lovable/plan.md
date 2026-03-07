

# Fix SMS Spoof API Endpoint

The current edge function uses `https://nigga.life/api/sms/send` but the correct endpoint is `https://api.nigga.life/api/sms/send`. Additionally, since the domain changed from `nigga.life` to `api.nigga.life`, the `origin`, `referer`, and `sec-fetch-site` headers should be updated accordingly.

## Changes

**`supabase/functions/sms-spoof/index.ts`** -- Update:
- Line 69: URL from `https://nigga.life/api/sms/send` to `https://api.nigga.life/api/sms/send`
- Line 76: `origin` from `https://nigga.life` to `https://api.nigga.life`
- Line 77: `referer` from `https://nigga.life/dashboard` to `https://api.nigga.life/dashboard`
- Line 84: `sec-fetch-site` stays `same-origin` (still same origin)

Single file edit, edge function will auto-deploy.

