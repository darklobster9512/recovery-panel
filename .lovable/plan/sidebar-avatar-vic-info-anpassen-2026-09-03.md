# Sidebar-Avatar & Vic-Info anpassen

## Ziel
Die Sidebar im `/dashboard` soll zwei Korrekturen erhalten:
1. Das Avatar-Bild von Dr. Thomas Korte muss nach unten versetzt werden, damit sein Gesicht sichtbar ist (aktuell wird nur der Oberkörper gezeigt).
2. Die Vic-Info-Karte soll zusätzlich das Guthaben (formatiert z. B. `100.000,00 €`) und das gescammte Projekt anzeigen.

## Änderungen

### 1. Avatar-Position korrigieren
- Datei: `src/pages/Dashboard.tsx`
- Das `<img>` für `thomasKorteAsset` in der Ansprechpartner-Karte erhält ein `object-position`-Attribut, das das Bild nach unten verschiebt, z. B. `object-[center_30%]` oder `object-[center_40%]`.
- Die runden Abmessungen (`w-12 h-12 rounded-full`) bleiben erhalten.

### 2. Profildaten erweitern
- In `loadProfile` wird die `select`-Abfrage um `balance, scam_project` erweitert.
- Zwei neue State-Variablen werden angelegt: `profileBalance` und `profileScamProject`.
- Die Werte werden aus der Supabase-Antwort gesetzt.

### 3. Vic-Info-Karte erweitern
- Die bestehende Vic-Info-Karte zeigt weiterhin Name, E-Mail und Telefon.
- Darunter wird das Guthaben angezeigt:
  - Verwendung von `Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" })`.
  - Ausgabe z. B. `100.000,00 €`.
  - Falls kein Guthaben vorhanden ist, wird der Block ausgeblendet oder mit `0,00 €` dargestellt.
- Darunter wird das gescammte Projekt angezeigt (Label optional, z. B. „Projekt:“), falls `scam_project` gesetzt ist.

### 4. Prüfung
- `bunx tsc --noEmit`
- `bun run build`
- Visueller Check im Preview auf `/dashboard` (Sidebar).

## Nicht im Scope
- Keine Änderungen an der Datenbank oder an anderen Seiten.
- Keine Änderungen an der Avatar-Datei selbst.
