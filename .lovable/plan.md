# Postident PDF im Vic-Dashboard: QR-Code + Download

Bei Postident-Aufträgen im `/dashboard` fehlen aktuell Download und Preview des hochgeladenen PDFs. Ziel: QR-Code aus dem PDF extrahieren, als Bild in der Auftragsansicht zeigen (Klick öffnet Fullscreen) und einen Download-Button für die PDF ergänzen.

## Änderungen

1. **PDF laden** (`src/pages/Dashboard.tsx`)
   - `verifications`-Select um `type` erweitern, `type` ins `Assignment`-Interface aufnehmen.
   - Beim Öffnen eines Postident-Auftrags: neuestes `user_documents`-Row zu `assignment_id` holen, dann `supabase.storage.from("user-documents").createSignedUrl(path, 3600)` erzeugen.

2. **QR-Code extrahieren** (neuer Client-Helper)
   - `pdfjs-dist` (bereits übliches Peer-Lib; wird via `bun add` ergänzt) rendert Seite 1 der PDF in ein Off-Screen-Canvas bei hoher Auflösung (scale 2.5).
   - `jsqr` scannt das Canvas nach einem QR-Code. Wenn gefunden: Bounding-Box mit Padding zu Data-URL croppen (`canvas.toDataURL("image/png")`), das ist das angezeigte QR-Bild.
   - Fallback wenn kein QR gefunden wird: Vollbild der Seite als Data-URL zeigen.
   - Ergebnis-State: `{ qrDataUrl: string; pdfUrl: string; fileName: string } | null`.

3. **UI-Sektion** (nur bei `type === "postident"` und vorhandenem Dokument)
   - Neue Karte „Postident QR-Code" im Stil der anderen Sektionen (goldene Section-Headline, `slate-50`-Card, `border-slate-200`).
   - QR-Bild zentriert, ~240×240 px, `cursor-zoom-in`; Klick öffnet Fullscreen-Lightbox: fixed overlay `bg-black/80`, Bild in Bildschirmgröße, Close-Button oben rechts + Klick außerhalb schließt.
   - Darunter Dateiname und Primary-Button „PDF herunterladen" (`<a href={pdfUrl} download={fileName}>`).
   - Ladezustand: Skeleton/Spinner während PDF/QR verarbeitet werden. Fehlerzustand: dezente Meldung + trotzdem Download-Button.

4. **Kein Backend-Change**: Storage-Policies, Upload-Flow, Admin-Panel und Routing bleiben unverändert.

## Technische Details

- Neue Deps: `pdfjs-dist`, `jsqr`. PDF-Worker via `import ... from "pdfjs-dist/build/pdf.worker.min.mjs?url"` an `GlobalWorkerOptions.workerSrc` binden (Vite-kompatibel).
- Extraktion läuft ausschließlich im Browser; die signierte URL wird per `fetch` → `ArrayBuffer` an pdf.js übergeben.
- Lightbox als lokales Portal-freies Overlay im Component-Tree (kein zusätzliches Package).
- Roadmap: Aufgabe wird als offener Task in `roadmap.md` festgehalten.
