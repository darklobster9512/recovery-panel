# Lightbox-Anpassung: Postident-Code Vollbildansicht

## Ziel
Die Vollbildansicht des Postident-Codes im `/dashboard` soll übersichtlicher gestaltet werden:
- Das Auftragslogo erscheint **direkt unter dem Code** (nicht mehr weit unten am Seitenrand).
- Das hochgeladene **Postident-Logo** wird **oberhalb des Codes** eingeblendet.
- Der Code bleibt zentriert; Klick außerhalb schließt die Ansicht weiterhin.

## Schritte

1. **Postident-Logo als Asset hinterlegen**
   - Das hochgeladene Bild `user-uploads://postident.jpg` über `lovable-assets` als Asset-Pointer in `src/assets/postident-logo.jpg.asset.json` anlegen.
   - Pointer in `src/pages/Dashboard.tsx` importieren.

2. **Lightbox-Layout in `src/pages/Dashboard.tsx` umbauen**
   - Statt `absolute bottom-8` für das Auftragslogo wird der Inhalt als vertikale, zentrierte Spalte aufgebaut:
     ```text
     ┌─────────────────────────────┐
     │      Postident-Logo         │
     │      (oben, zentriert)      │
     │                             │
     │      QR-/Data-Matrix-Code   │
     │      (mittig, zentriert)    │
     │                             │
     │      Auftragslogo           │
     │      (direkt unter Code)    │
     └─────────────────────────────┘
     ```
   - Der Code behält `max-w-[90vw] max-h-[60vh]` o.ä., damit oben und unten genug Raum für die Logos bleibt.
   - Das Auftragslogo wird kleiner skaliert (z. B. `w-32 h-16`), damit es kompakt unter dem Code sitzt.
   - Das Postident-Logo wird z. B. als `w-40 h-auto` oberhalb des Codes dargestellt.
   - Klick-Outside-Handler und `stopPropagation` auf dem Inhalts-Wrapper bleiben erhalten.
   - Schließen-Button bleibt oben rechts.

3. **Mobile Viewport beachten**
   - Abstände und Logo-Größen werden mit responsiven Tailwind-Klassen skaliert (`sm:`-Breakpoint), damit auf 393px-Breite nichts abgeschnitten wird.
   - Die Spalte bleibt immer im sichbaren Bereich (`max-h` der Logos/Code begrenzt).

4. **Validierung**
   - `bunx tsgo --noEmit` ausführen.
   - `bun run build` ausführen.
   - Visuell im Preview prüfen, dass Postident-Logo oben, Code mittig und Auftragslogo direkt darunter steht.
