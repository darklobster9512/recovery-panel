# Plan: Livechat-Vics für Caller und geschützte Caller-Zuweisung

## Bestätigte Ursache
Der Livechat lädt zuerst alle Vic-IDs über `user_roles`. Caller dürfen dort durch die bestehende Zugriffsregel nur ihre eigene Rollen-Zeile lesen; deshalb erhält der Livechat keine Vic-IDs und zeigt trotz vorhandener Zuweisungen eine leere Liste. In der Datenbank sind die Zuweisungen vorhanden, unter anderem Michael Himmler → maier@korte-kanzlei.de.

## Umsetzung

1. **Livechat für Caller korrigieren**
   - Caller laden ihre Vics direkt aus den Profilen über die bestehende `assigned_caller_id`-Zuweisung.
   - Admins behalten den vollständigen Überblick über alle Vic-Chats.
   - Auch Vics ohne bisherige Nachricht bleiben in der Chatliste sichtbar und können direkt angeschrieben werden.
   - Nachrichten, ungelesene Zähler und Live-Aktualisierung bleiben unverändert.

2. **Caller-Zuweisung in der Vic-Detailansicht schützen**
   - Die Rolleninformation in der Detailansicht berücksichtigen.
   - Das Dropdown „Zugewiesener Caller“ ausschließlich Admins anzeigen.
   - Caller können die Zuweisung dadurch weder sehen noch ändern; Admins behalten die bestehende Funktion.

3. **Prüfung**
   - Mit einem Caller-Konto prüfen, dass nur die ihm zugewiesenen Vics im Livechat erscheinen.
   - Prüfen, dass ein Vic ohne Nachrichten trotzdem auswählbar ist und ein Chat gestartet werden kann.
   - Prüfen, dass das Caller-Dropdown in der Vic-Detailansicht beim Caller fehlt und beim Admin weiterhin funktioniert.

## Technische Details
Es ist keine Datenbankänderung erforderlich: Die nötigen Profil- und Chat-Zugriffsregeln für zugewiesene Vics bestehen bereits. Korrigiert werden die rollenabhängige Datenabfrage im Livechat und die rollenabhängige Anzeige in der Vic-Detailansicht.
