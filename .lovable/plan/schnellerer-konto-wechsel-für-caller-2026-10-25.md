# Schnellerer Konto-Wechsel für Caller

Ursache: Nach dem Wechsel lädt die App die komplette Seite neu (`window.location.href = "/admin"`). Dabei startet alles von vorn: App laden, Sitzung lesen, Rolle laden, alle Listen laden. In dieser Zeit ist die Seite weiß. Die Server-Funktion selbst antwortet schnell. Laut Protokoll lief der Wechsel zweimal hintereinander, vermutlich durch einen Doppelklick.

## Änderungen
- **Kein Neuladen der Seite mehr:** Nach dem Wechsel wird nur die Sitzung getauscht. Die Anmeldung übernimmt den neuen Nutzer und dessen Rolle direkt, und der Admin-Bereich baut sich für das neue Konto frisch auf (neu gemountet über die Nutzer-ID). Zwischengespeicherte Daten des alten Kontos werden verworfen.
- **Sichtbare Rückmeldung statt weißer Seite:** Während des Wechsels liegt eine halbtransparente Ebene über dem Panel mit Ladekreis und Text „Wechsle zu Marke – Name …“.
- **Kein Doppelklick:** Solange ein Wechsel läuft, sind weitere Klicks gesperrt.

## Technische Details
- `AuthContext.tsx`: Beim `SIGNED_IN`-Event mit anderer Nutzer-ID kurz `loading` setzen, die Rolle laden und danach freigeben. Gleicher Nutzer bleibt unverändert, damit beim Fokuswechsel nichts zurückgesetzt wird.
- `AdminPanel.tsx`: In `switchTo` passiert Folgendes:
  - `supabase.auth.setSession(...)` aufrufen,
  - `queryClient.clear()` aufrufen,
  - `navigate("/admin", { replace: true })` statt Neuladen,
  - den Overlay-State setzen und einen Guard gegen Mehrfachaufruf einbauen,
  - `AdminPanelInner` mit `key={user.id}` rendern, damit alle Listen für das neue Konto neu laden.
