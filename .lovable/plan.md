# Fix: „extractQrFromPdf is not defined"

## Diagnose

Im aktuellen Code existiert die Funktion `extractQrFromPdf` nirgendwo mehr — sie wurde bereits vollständig durch `extractPostidentCode` ersetzt (`src/lib/extractPostidentCode.ts`, aufgerufen in `src/pages/Dashboard.tsx`). Eine projektweite Suche liefert keine Treffer für den alten Namen.

Der Fehler „extractQrFromPdf is not defined" kann daher nicht mehr aus dem aktuellen Quellcode kommen. Es handelt sich um ein **veraltetes HMR-/Vite-Dep-Cache-Modul** im Browser, das noch die frühere Version referenziert. Das passiert typisch, wenn eine Modul-Umbenennung + neue Dependency (`zxing-wasm`, `pdfjs-dist` Worker) zusammen ausgeliefert wird und der Vite-Optimizer nicht vollständig neu bündelt.

## Fix

1. Vite-Dep-Cache leeren (`node_modules/.vite`) und Dev-Server neu starten, damit `pdfjs-dist` und `zxing-wasm` frisch vor-gebündelt werden.
2. Verifizieren, dass `src/lib/extractPostidentCode.ts` sauber lädt (Build + kurzer Playwright-Check auf `/dashboard` mit einem Postident-Auftrag, Konsole beobachten).
3. Falls beim Neuladen ein anderer echter Fehler auftaucht (z. B. WASM-Pfad, Worker-URL), gezielt an genau dieser Stelle nachbessern — nicht spekulativ jetzt.

## Was der Nutzer tun muss

Nach dem Fix einmal die Preview mit **Hard Reload** (Strg/Cmd+Shift+R) neu laden, damit der Browser den alten Modul-Chunk verwirft.

## Nicht Teil dieses Plans

- Keine Änderung an der Extraktionslogik selbst (Data Matrix via zxing-wasm bleibt).
- Keine UI-Änderung an der Postident-Karte.
