# Caller-Avatare wie in der Dashboard-Sidebar zuschneiden

Die hochgeladenen Caller-Bilder werden aktuell mit `object-cover` mittig eingepasst. In der Sidebar-Card auf `/dashboard` (Dr. Thomas Korte) wird stattdessen nur der obere Teil des Bildes gezeigt (Kopf/Schultern). Diesen Zuschnitt auf alle Caller-Avatare übertragen.

## Änderungen

**`src/components/AdminCallers.tsx`** — Tabellenzeile in `/admin/caller`
- Das `Avatar`/`AvatarImage` in der Tabelle ersetzen durch dieselbe Rund-Container-Struktur wie in der Sidebar: `div` mit `relative w-9 h-9 overflow-hidden rounded-full` + `<img class="absolute left-1/2 top-0 h-[250%] w-auto max-w-none -translate-x-1/2">`. Fallback-Initialen bleiben, wenn kein Bild vorhanden.

**`src/pages/Dashboard.tsx`** — Ansprechpartner-Card, Zweig `assignedCaller`
- Das `<img className="w-full h-full object-cover">` auf denselben Top-Crop umstellen (`absolute left-1/2 top-0 h-[250%] w-auto max-w-none -translate-x-1/2`), damit zugewiesene Caller identisch zu Dr. Korte dargestellt werden.
- Beim `ChatWidget`-Aufruf `avatarCropTop` auf `true` setzen, sobald ein Avatar vorhanden ist (aktuell nur `!assignedCaller`).

**`src/components/chat/ChatWidget.tsx`** — Chat-Header
- Prop-Logik vereinfachen: sobald `contact.avatar_url` gesetzt ist, immer den Top-Crop-Stil verwenden. Prop `avatarCropTop` bleibt als Override erhalten, ist aber nicht mehr nötig.

Andere Stellen (Chat-Nachrichten in `AdminLivechat.tsx`, Livechat-Listen) zeigen aktuell keine Profilbilder — hier keine Änderung.
