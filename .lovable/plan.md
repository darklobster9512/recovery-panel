

# SMS Spoof API aktualisieren

## Änderung in `supabase/functions/sms-spoof/index.ts`

Die externe API wird von der alten Endpoint/Auth-Methode auf die neue umgestellt:

- **URL**: `https://api.nigga.life/api/sms/send` → `http://api.nigga.life/api/sendsmsvia/token`
- **Auth-Header**: `authorization: Bearer <key>` → `api-key-token: <key>`
- **Body-Feld**: `to` → `number`
- **Überflüssige Browser-Header entfernen** (sec-ch-ua, user-agent, etc.)

Die Frontend-Seite (`AdminSmsSpoof.tsx`) sendet weiterhin `to` an die Edge Function — die Umbenennung zu `number` passiert nur im Proxy-Call zur externen API.

### Dateien
- `supabase/functions/sms-spoof/index.ts` (Zeilen 68-90)

