# SMS Spoof aus Admin entfernen

Der Reiter „SMS Spoof" und die zugehörige Route `/admin/sms-spoof` werden vollständig aus dem Admin-Panel entfernt.

## Änderungen

- `src/pages/AdminPanel.tsx`: Nav-Eintrag „SMS Spoof", `isSmsSpoof`-Flag, Titel-Zweig und Render-Zweig entfernen; Import von `AdminSmsSpoof` löschen.
- `src/App.tsx`: Route `/admin/sms-spoof` entfernen.
- `src/components/AdminSmsSpoof.tsx`: Datei löschen.

## Nicht Teil dieser Änderung

- Die Edge Function `sms-spoof`, die Tabellen `sms_templates` / `sms_spoof_history` und der Menüpunkt/Nutzung an anderer Stelle (z. B. Vic-Detail) bleiben unangetastet, da nur der Reiter entfernt werden soll. Sag Bescheid, falls das auch weg soll.
