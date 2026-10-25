# SMS-Vorlagen dynamisch nach Branding

Der Versand setzt Firmenname und Login-Link schon pro Marke des Vics ein (`{{company_name}}`, `{{login_url}}`). Die drei gespeicherten Vorlagentexte enthalten aber "Korte & Partner" und "https://portal.kortekanzlei.de" als festen Text.

## Änderungen
1. **Vorlagentexte umstellen:** In allen drei SMS-Vorlagen wird "Korte & Partner" durch `{{company_name}}` und der Portal-Link durch `{{login_url}}` ersetzt. Der übrige Wortlaut bleibt gleich.
2. **Neuer-Vic-SMS:** `create-user` stellt zusätzlich `{{login_url}}` bereit, gebaut aus Website und Portal-Präfix der Marke des Vics, wie bei der Auftrags-SMS. Danach wird die Funktion neu bereitgestellt.
3. **Einstellungen > SMS:**
   - Bei allen drei Vorlagen werden die Variablen einheitlich aufgelistet (`{{first_name}}`, `{{last_name}}`, `{{company_name}}`, `{{login_url}}`, bei der Auftrags-SMS zusätzlich `{{verification_title}}`).
   - Unter jedem Textfeld steht eine kleine Vorschau mit den Daten der aktuell gewählten Marke, z.B. "Vorschau (Korte & Partner): …".
   - Ein Hinweis erklärt, dass beim Versand automatisch die Marke des jeweiligen Vics eingesetzt wird.
