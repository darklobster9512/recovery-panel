# Mobile-Feinschliff Dashboard

Nur Mobile-View (bis `sm`), keine Desktop-Änderungen.

## Änderungen

1. **Anleitung — App-Store-Buttons zentrieren (mobile)**
   - `src/components/RecoveryGuide.tsx`: Der Container der beiden Store-Badges bekommt auf Mobile `justify-center` (Desktop bleibt wie bisher, z. B. `sm:justify-start`).

2. **Videoident-Aufträge — App-Download-Buttons full-width (mobile)**
   - `src/pages/Dashboard.tsx`: In der Detailansicht die WebID-/App-Buttons (Google Play + App Store) auf Mobile auf volle Contentbreite skalieren.
   - Wrapper: `flex-col` auf Mobile, jeder Button `w-full` (Badge-Bild `w-full h-auto`), auf `sm:` zurück auf bisherige Inline-Darstellung.

3. **Sidebar auf Mobile bei Reiterwechsel schließen**
   - `src/pages/Dashboard.tsx`: Beim Klick auf einen Sidebar-Nav-Eintrag im mobilen Sheet zusätzlich `setSidebarOpen(false)` (bzw. den aktuellen Sheet-Open-State) aufrufen. Desktop bleibt unberührt.

## Tests
- `bunx tsgo --noEmit` und `bun run build`.
