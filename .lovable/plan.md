# SMS-Versand für Berthold reparieren

## Ursache (bestätigt)
Beim neuen Lead von 14:49 Uhr wurde das Konto angelegt und die SMS an seven.io geschickt. seven.io hat mit **Code 900 – „API-Schlüssel ungültig“** abgelehnt. Der seven.io-Schlüssel bei **Berthold & Partner** ist falsch oder abgelaufen. Deshalb taucht in deinem seven.io-Dashboard nichts auf. Der Absender „KanzleiBP“ ist in Ordnung.

## Was du tun musst
Unter Brandings → Berthold & Partner → Bearbeiten den richtigen seven.io-Schlüssel eintragen (seven.io → Einstellungen → API-Schlüssel). Alternativ das Feld leeren, dann nutzt Berthold automatisch den allgemeinen Schlüssel aus den Einstellungen.

## Was ich zusätzlich baue
1. **Warnung beim Speichern:** Wenn du im Branding einen seven.io-Schlüssel einträgst, wird er sofort geprüft; ein ungültiger Schlüssel wird rot gemeldet.
2. **Hinweis beim Lead-Import / Konto anlegen:** Nach dem Anlegen erscheint eine Meldung, wie viele SMS gesendet bzw. fehlgeschlagen sind, mit Grund.
3. **SMS nachsenden:** Button auf der Leads-Seite „Fehlgeschlagene Begrüßungs-SMS erneut senden“ für Vics, deren SMS nicht ankam (inkl. der 111 Berthold-Vics der letzten Tage, die bisher kein Protokoll haben). Vor dem Senden wird die Anzahl bestätigt.

## Technische Details
- `sevenio-check` um Modus „einzelnen Schlüssel prüfen“ erweitern (Admin-only), aufgerufen beim Speichern in `AdminBrandings.tsx`.
- `create-user` gibt `sms_result` bereits zurück; `createVicAccountsForLeads` zählt `ok`/Fehler und zeigt sie im Toast.
- Neue Edge Function `resend-welcome-sms` (Admin-only): wählt Vics ohne erfolgreichen `sms_dispatch_log`-Eintrag (`kind = new_user`), nutzt Vorlage `new_user_sms` mit Login-Link der Marke (ohne Passwort, falls die Vorlage es nicht enthält), protokolliert jedes Ergebnis.
