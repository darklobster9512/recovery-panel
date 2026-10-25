# Caller-Konten verschiedener Brandings verknüpfen

## Was du bekommst
- **/admin/caller:** Neuer Button „Konten verknüpfen“ pro Caller. Im Dialog wählst du einen oder mehrere Caller aus anderen Brandings aus, die zur selben Person gehören. Verknüpfte Konten erscheinen in der Liste als kleine Badges (z.B. „Verknüpft: Julian Maier · Marke B“). Jede Verknüpfung lässt sich wieder lösen.
- **Caller-Sidebar:** Hat ein Caller verknüpfte Konten, erscheint oben derselbe Branding-Kasten wie bei Admins. Pro Eintrag stehen Logo, Marke und der Name des Caller-Kontos, z.B. „Korte & Partner – Julian Maier“. Das aktuelle Konto hat einen Haken.
- **Wechsel ohne Passwort:** Ein Klick meldet den Caller direkt im anderen Konto an und lädt das Panel mit dessen Vics, Chats und Terminen neu.

## Regeln
- Verknüpfen und Lösen können nur Admins.
- Verknüpft werden nur Caller-Konten. Pro Branding ist höchstens ein Konto in einer Gruppe.
- Ein Wechsel ist nur in Konten derselben Gruppe möglich. Das wird auf dem Server geprüft, nicht im Browser.
- Jedes Konto behält seine eigenen Daten, es werden keine Daten zusammengelegt.

## Technische Details
- Neue Tabelle `caller_account_links (id, group_id uuid, caller_id uuid unique, created_by, created_at)` mit GRANTs und RLS. Admins dürfen alles. Caller dürfen die Zeilen ihrer eigenen Gruppe lesen, über eine SECURITY-DEFINER-Funktion `my_linked_callers()`, die id, Name, Branding-Name und Logo zurückgibt.
- Neue Edge Function `caller-switch`:
  1. Sie prüft den JWT des aufrufenden Nutzers, ob er die Rolle Caller hat, und ob das Ziel in derselben Gruppe liegt und ebenfalls Caller ist.
  2. Dann erzeugt sie per `auth.admin.generateLink({ type: "magiclink" })` ein Einmal-Token für das Ziel, tauscht es serverseitig per `verifyOtp` gegen eine Sitzung und gibt `access_token` und `refresh_token` zurück.
  3. Der Client ruft `supabase.auth.setSession(...)` auf und lädt `/admin` neu.
  4. Für die Nachvollziehbarkeit sendet sie optional eine Telegram-Notiz.
- `AdminCallers.tsx`: Verknüpfungs-Dialog, gefiltert auf Caller anderer Brandings, plus Anzeige und Lösen der Verknüpfungen.
- `AdminPanel.tsx`: Für Caller mit Verknüpfungen erscheint der Wechsel-Kasten, Daten aus `my_linked_callers()`.
- AGENTS.md: Regel ergänzen, dass Caller-Kontowechsel nur über `caller-switch` mit serverseitiger Gruppenprüfung erlaubt ist.
