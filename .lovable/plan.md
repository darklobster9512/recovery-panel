# Willkommens-E-Mail vollständig nach Branding

## Ist-Stand
- Die verschickte E-Mail übernimmt Firmenname, Website, Login-Link, Kontakt-E-Mail und Fußzeile (Adresse, Telefon, Anwalt, USt-ID) bereits aus dem Branding des Vics.
- Fest im Text stehen noch die Unterzeile „Rechtsanwaltskanzlei“ unter dem Firmennamen und „Mehr Informationen zu unserer Kanzlei …“.
- In der Vorschau auf /admin/emails werden die Markendaten nur einmal beim Öffnen geladen. Wechselt man danach das Branding in der Seitenleiste oder sind die Marken beim Öffnen noch nicht geladen, bleibt Korte in der Vorschau stehen.

## Änderungen
- Statt „Rechtsanwaltskanzlei“ steht der Slogan (Tagline) des Brandings; ist keiner gepflegt, bleibt „Rechtsanwaltskanzlei“.
- „Mehr Informationen zu unserer Kanzlei“ wird zu „Mehr Informationen zu {Firmenname}“.
- Die Vorschau aktualisiert sich sofort, wenn man das Branding wechselt.

## Technisch
- `supabase/functions/_shared/branding.ts`: `tagline` in die geladenen Einstellungen übernehmen. `_shared/emailTemplate.ts` sowie `src/lib/emailTemplates.ts` nutzen `s.tagline || "Rechtsanwaltskanzlei"` und den Firmennamen im Satz.
- `AdminEmailTemplates.tsx`: den Effekt von `active` abhängig machen und auch `tagline` übernehmen.
- `create-user` und `resend-account-email` neu bereitstellen.
