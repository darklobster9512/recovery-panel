# Livechat immer freigeschaltet

## Ziel
Der Livechat im Vic-Dashboard soll immer verfügbar sein – auch solange die Identitätsprüfung noch läuft (`member_status === "in_bearbeitung"`).

## Aktueller Zustand
- `src/components/chat/ChatWidget.tsx` rendert eine Sperr-Anzeige, wenn der Prop `locked={true}` übergeben wird.
- `src/pages/Dashboard.tsx` übergibt `locked={memberStatus === "in_bearbeitung"}` an das Widget.
- Damit ist der Chat für Vics gesperrt, deren Profil-Status noch "in_bearbeitung" ist.

## Änderungen
1. **Gating-Logik entfernen**
   - In `src/pages/Dashboard.tsx` den `locked`-Prop für `<ChatWidget />` auf `false` setzen (oder den Prop entfernen und im Widget-Default belassen).
   - Die `lockedMessage`-Prop kann entfernt werden, da sie nicht mehr angezeigt wird.

2. **State bereinigen (optional)**
   - `memberStatus` muss weiterhin geladen werden, falls es an anderer Stelle verwendet wird. Nur die Chat-Sperre wird entkoppelt.
   - Prüfen, ob `memberStatus` ausschließlich für die Chat-Sperre genutzt wird; falls ja, kann der State und das zugehörige Query entfallen.

3. **Verifizierung**
   - Vorschau öffnen und prüfen, dass das Chat-Widget direkt die normale Chat-Oberfläche zeigt, ohne Schloss-Symbol oder Hinweistext.

## Dateien
- `src/pages/Dashboard.tsx`
