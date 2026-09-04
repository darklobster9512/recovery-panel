# SMS an Vic beim Zuweisen eines Auftrags

Sobald ein Vic einem Auftrag zugewiesen wird, erhält er automatisch eine SMS über seven.io mit einem Hinweis auf den neuen Auftrag.

## Ablauf

1. In `AssignVerificationDialog` wird nach erfolgreichem `verification_assignments`-Insert (und nach dem optionalen PDF-Upload für Postident) die Edge Function `send-assignment-sms` aufgerufen: `{ assignment_id }`.
2. Die Edge Function lädt Assignment, Vic-Profil (Telefonnummer, Vorname), Verifikation (Titel) sowie `app_settings` und die SMS-Vorlage aus `sms_templates_config`.
3. Über seven.io wird die SMS mit dem konfigurierten Absendernamen versendet. Fehlt Telefonnummer oder Vorlage, wird still übersprungen (Log-Eintrag, keine Fehlermeldung im UI).

## SMS-Vorlage

Neuer Key `assignment_created_sms` in `sms_templates_config`. Variablen: `{first_name}`, `{verification_title}`, `{company_name}`, `{login_url}`.

Standardtext:
```
Hallo {first_name}, in Ihrem Portal wurde ein neuer Auftrag „{verification_title}" hinterlegt. Bitte loggen Sie sich ein, um fortzufahren: {login_url} — {company_name}
```

Bearbeitbar unter `/admin/einstellungen` (analog zu den bestehenden SMS-Vorlagen: eigene Karte „SMS-Vorlage: Auftragszuweisung").

## Technische Details

Neue Edge Function: `supabase/functions/send-assignment-sms/index.ts`
- CORS + Zod-Validierung `{ assignment_id: uuid }`
- Service-Role-Client, lädt Assignment + Verification + Profile + Settings + Template
- Nutzt vorhandene seven.io-Logik (Fetch-Aufruf analog `create-user`); ggf. in `_shared/sendSms.ts` extrahieren, wenn sinnvoll — sonst inline
- `renderTemplate` inline (kleiner Helper)

Migration:
- `INSERT INTO sms_templates_config(key, content) VALUES ('assignment_created_sms', '<default>') ON CONFLICT (key) DO NOTHING;`

Frontend:
- `AssignVerificationDialog.tsx`: nach dem Toast `supabase.functions.invoke('send-assignment-sms', { body: { assignment_id: assignment.id } })` (fire-and-forget, Fehler nur loggen).
- `AdminSettings.tsx` + `src/lib/settings.ts`: neue Karte + Fetch/Save für Key `assignment_created_sms`.

Keine RLS-Änderungen — Zugriff erfolgt via Service Role in der Edge Function.
