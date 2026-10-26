# portal.berthold-partner.de als erlaubte Domain

## Ziel
Das Portal soll auch über `portal.berthold-partner.de` erreichbar sein.

## Änderung
- **vite.config.ts**: `portal.berthold-partner.de` zu `server.allowedHosts` hinzufügen. Die bisherigen Einträge (`web.bovensiepenpartner.de`, `portal.kortekanzlei.com`, `portal.kortekanzlei.de`) bleiben.

## Hinweis
- Die Domain muss in Lovable verbunden und per DNS eingerichtet sein. Erst dann lädt die Login-Seite das Berthold-Branding über diese Adresse.
