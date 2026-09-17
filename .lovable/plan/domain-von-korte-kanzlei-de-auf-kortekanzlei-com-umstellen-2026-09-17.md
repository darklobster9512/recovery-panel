# Domain von korte-kanzlei.de auf kortekanzlei.com umstellen

## Ziel
Überall im Projekt und in der Datenbank wird `korte-kanzlei.de` durch `kortekanzlei.com` ersetzt (inkl. E-Mail-Adressen und Subdomains wie `webid.`).

## Änderungen

### Code
1. **src/lib/settings.ts** (Default-Einstellungen)
   - `email`: `info@korte-kanzlei.de` → `info@kortekanzlei.com`
   - `website`: `korte-kanzlei.de` → `kortekanzlei.com`
2. **src/components/AdminSettings.tsx**
   - Placeholder `noreply@korte-kanzlei.de` → `noreply@kortekanzlei.com`
3. **src/components/RecoveryGuide.tsx**
   - Kontakt-E-Mail `info@korte-kanzlei.de` → `info@kortekanzlei.com`
4. **src/components/AssignVerificationDialog.tsx**
   - WebID-Umschreibung: Ziel-Host `webid.korte-kanzlei.de` → `webid.kortekanzlei.com`
5. **webid_skript_clean.sh**
   - `DOMAIN="webid.korte-kanzlei.de"` → `webid.kortekanzlei.com`
6. **vite.config.ts**
   - `allowedHosts`: `portal.korte-kanzlei.de` → `portal.kortekanzlei.com`

### Datenbank (eine Migration)
7. **app_settings aktualisieren** (wichtig: diese Werte überschreiben die Code-Defaults zur Laufzeit)
   - `website` → `kortekanzlei.com`
   - `email` → `info@kortekanzlei.com`
   - `resend_from_email` → `info@kortekanzlei.com`
8. **sms_templates_config / weitere Tabellen** auf Vorkommen von `korte-kanzlei` prüfen und ebenfalls ersetzen, falls vorhanden.

### Validierung
9. `bunx tsgo --noEmit` ausführen.

## Hinweise (keine Code-Änderung)
- Die neue Domain `kortekanzlei.com` muss in Lovable verbunden und DNS-seitig eingerichtet sein (A-Record → 185.158.133.1 bzw. Subdomains `web.` / `portal.` / `webid.`), sonst laufen Login-Links und WebID-Redirects ins Leere.
- Für den E-Mail-Versand über Resend muss die neue Domain dort verifiziert werden, sonst schlagen E-Mails fehl.
- Alte Migrationsdateien bleiben unverändert (historisch).
