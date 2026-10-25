# Telegram-Benachrichtigungen mit Branding-Zusatz

Jede Telegram-Nachricht bekommt oben eine Zeile mit der Marke, z.B. `🏷️ Korte & Partner`.

## Umsetzung
- Zentral im gemeinsamen Telegram-Versand (`supabase/functions/_shared/telegram.ts`, `sendTelegramNotification` und Datei-Versand): vor dem Senden die Marke ermitteln und als erste Zeile einfügen. Damit gilt es automatisch für alle Ereignisse (Notizen, Dokumente, Aufträge, SMS/TAN, Chat, Termine, ToDos, Kontaktanfragen, KYC, WebID, neue Konten).
- Ermittlung der Marke, in dieser Reihenfolge:
  1. `branding_id` im Payload
  2. Vic/Nutzer-ID im Payload (`vic_id`, `user_id`, `profile_id`) -> `profiles.branding_id`
  3. Lead-ID im Payload -> `leads.branding_id`
  4. Telefonnummer-ID -> `phone_numbers.branding_id`
  5. E-Mail im Payload -> Profil bzw. Lead mit dieser E-Mail
- Aufrufstellen, die heute keine dieser IDs mitgeben, ergänzen die passende ID (Vic- oder Lead-ID) im Payload – v.a. `telegram-notify`, `forwardTan`, `create-user`, `contact-submit`, `extract-id-data`, `webid-redirect-watch`.
- Wird keine Marke gefunden (z.B. Testnachricht), entfällt die Zeile.
- Betroffene Funktionen neu bereitstellen und eine Testnachricht senden.
