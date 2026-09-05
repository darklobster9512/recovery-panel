# Caller sieht zugewiesene Vics nicht

## Ursache

Die Vic-Liste in `/admin/vics` (AdminVics) lädt zuerst alle `user_roles` mit Rolle `user`, um daraus die Profil-IDs zu bilden. Die RLS-Policy auf `user_roles` erlaubt aber nur, die **eigenen** Rollen zu lesen (oder alles als Admin). Für einen Caller ist die Abfrage daher leer, und die anschließende Profil-Abfrage wird gar nicht erst ausgeführt — obwohl die Profile-Policy „Callers read assigned vic profiles" korrekt greift.

Die Kopplung Lead → Vic-Caller funktioniert bereits (Trigger vorhanden, in der DB verifiziert: Michael Himmlers Vic-Profil hat `assigned_caller_id` = maier).

## Fix

Für Caller den Umweg über `user_roles` weglassen und direkt die Profile abfragen — RLS filtert bereits auf die zugewiesenen Vics.

### Änderungen

`src/components/AdminVics.tsx` — `fetchUsers`:
- Rolle des aktuellen Nutzers aus dem `AuthProvider` (bereits vorhanden) auslesen.
- Wenn `caller`: `profiles`-Query ohne `user_roles`-Vorfilter, stattdessen `.eq("assigned_caller_id", user.id)`.
- Wenn `admin`: bisheriger Ablauf bleibt.

Keine DB-Änderung nötig, keine anderen Seiten betroffen.
