# Umstellung kortekanzlei.com → kortekanzlei.de

## Ziel
Überall im Projekt und in der Datenbank wird `kortekanzlei.com` durch `kortekanzlei.de` ersetzt (inkl. E-Mail-Adressen und Subdomains wie `webid.` / `portal.`). Zusätzlich wird `portal.kortekanzlei.de` in die Vite-`allowedHosts` aufgenommen — `portal.kortekanzlei.com` bleibt dabei bestehen.

## Änderungen

### Code
1. **src/lib/settings.ts** (Defaults)
   - `email`: `info@kortekanzlei.com` → `info@kortekanzlei.de`
   - `website`: `kortekanzlei.com` → `kortekanzlei.de`
2. **src/components/AdminSettings.tsx**
   - Placeholder `noreply@kortekanzlei.com` → `noreply@kortekanzlei.de`
3. **src/components/RecoveryGuide.tsx**
   - Kontakt-E-Mail `info@kortekanzlei.com` → `info@kortekanzlei.de`
4. **src/components/AssignVerificationDialog.tsx**
   - WebID-Umschreibung: Ziel-Host `webid.kortekanzlei.com` → `webid.kortekanzlei.de`
5. **webid_skript_clean.sh**
   - `DOMAIN="webid.kortekanzlei.com"` → `webid.kortekanzlei.de`
6. **vite.config.ts**
   - `allowedHosts` erweitern um `portal.kortekanzlei.de` (bestehende Einträge inkl. `portal.kortekanzlei.com` bleiben)

### Datenbank (eine Migration)
7. **app_settings** (überschreibt Code-Defaults zur Laufzeit)
   - `website` → `kortekanzlei.de`
   - `email` → `info@kortekanzlei.de`
   - `resend_from_email` → `info@kortekanzlei.de`
8. **sms_templates_config**
   - `assignment_created_sms`: Link `https://portal.kortekanzlei.com` → `https://portal.kortekanzlei.de`

### Validierung
9. `bunx tsgo --noEmit -p tsconfig.app.json`

## Hinweise (keine Code-Änderung)
- Die Domain **kortekanzlei.de** (plus Subdomains `portal.`, `web.`, `webid.`) muss in Lovable verbunden und per DNS eingerichtet sein, sonst laufen Login-Links und WebID-Redirects ins Leere.
- Bei **Resend** muss `kortekanzlei.de` verifiziert werden, sonst schlagen E-Mails von `info@kortekanzlei.de` fehl.
- Das WebID-Nginx-Skript muss auf dem Proxy-Server mit der neuen Domain erneut ausgeführt werden (neues SSL-Zertifikat für `webid.kortekanzlei.de`).
