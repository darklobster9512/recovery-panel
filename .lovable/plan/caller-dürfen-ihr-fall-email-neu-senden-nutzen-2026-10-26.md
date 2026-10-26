# Caller dürfen „Ihr Fall Email neu senden“ nutzen

## Änderung
- Auf der Vic-Detailseite sehen Caller jetzt den Knopf „Ihr Fall Email neu senden“ und können ihn benutzen.
- Das gilt nur für Vics, die dem Caller zugewiesen sind. Bei anderen Vics lehnt der Server ab.
- Admins behalten den Knopf wie bisher.

## Technische Details
- `src/components/AdminVicDetail.tsx`: Bedingung `role === "admin"` am Button auf Admin oder Caller erweitern.
- `supabase/functions/resend-account-email/index.ts`: Admin-Prüfung ersetzen durch `authorizeVicAccess(req, user_id)` aus `_shared/vicAccess.ts` (Admin oder zugewiesener Caller), danach den Service-Client wie bisher nutzen.
