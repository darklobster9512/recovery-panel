# Dashboard: Rück-Buttons entfernen und Sidebar neu strukturieren

## Ziel
- Alle "Zurück"-Buttons im Dashboard entfernen, weil die Navigation jetzt über die Sidebar läuft.
- Die Desktop-Sidebar neu aufbauen: Ansprechpartner-Karte oben, Vic-Info über dem Logout, Logout ganz unten, danach Trennstrich und zentrierte Kooperationslogos.

## Dateien und Änderungen

### 1. Asset anlegen
- `src/assets/thomas-korte.png.asset.json` aus `user-uploads://thomas-korte.png` über `lovable-assets create` erzeugen.

### 2. `src/pages/Dashboard.tsx`
- **Detail-View**: Den "Zurück"-Button (inkl. `ArrowLeft`-Import, falls nur dort genutzt) entfernen.
- **`SidebarInner` neu strukturieren**:
  1. Logo (bleibt)
  2. **Ansprechpartner-Karte** (neu an der Stelle der alten Vic-Info):
     - Rundes Avatar-Bild (`aspect-square rounded-full object-cover`) mit dem hochgeladenen Bild
     - Daneben/Rechts:
       - `Dr. Thomas Korte`
       - `Rechtsanwalt`
       - `040 573086460`
  3. Separator
  4. Navigation (bleibt)
  5. Flex-Spacer, um den Footer nach unten zu drücken
  6. **Vic-Info-Karte** (bisher oben) über dem Logout
  7. **Abmelden**-Button ganz unten
  8. Separator
  9. **In Kooperation mit**:
     - Text zentriert
     - IOSCO- und Europol-Logos vertikal zentriert untereinander
     - IOSCO-Logo etwas größer als Europol (z.B. IOSCO `h-7`, Europol `h-6`)
- `onBack`-Prop für `RecoveryVisualization`, `RecoveryGuide` und `DocumentUpload` entfernen.

### 3. `src/components/RecoveryVisualization.tsx`
- `onBack`-Prop aus der TypeScript-Schnittstelle entfernen.
- Den "Zurück"-Button entfernen.
- `onOpenGuide` bleibt erhalten.

### 4. `src/components/RecoveryGuide.tsx`
- `onBack`-Prop entfernen.
- Den "Zurück"-Button entfernen.

### 5. `src/components/DocumentUpload.tsx`
- `onBack`-Prop entfernen.
- Den "Zurück"-Button entfernen.

## Keine Backend-/API-/Datenbank-Änderungen

## Verifikation
- `bunx tsc --noEmit`
- `bun run build`
- Visueller Check im Preview:
  - Keine "Zurück"-Buttons mehr auf Rückverfolgung, Anleitung, Dokumente-Upload und Auftrags-Detail
  - Sidebar zeigt Ansprechpartner-Karte mit Avatar oben
  - Vic-Info, Abmelden und Kooperationslogos unten in der richtigen Reihenfolge
  - Kooperationslogos zentriert, IOSCO etwas größer als Europol
