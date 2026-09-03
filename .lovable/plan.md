Mobile App-Store/Play-Store Buttons in Anleitung nebeneinander

1. Datei anpassen: `src/components/RecoveryGuide.tsx` (Zeilen 75-98).
2. Ziel: In der Mobile-Ansicht sollen App-Store- und Google-Play-Badges nebeneinander erscheinen (nicht untereinander) und zusammen die volle Content-Breite ausfüllen.
3. Umsetzung: Wrapper auf `flex flex-row sm:flex-wrap justify-center sm:justify-start gap-3` setzen; jedes `<a>` erhält `flex-1 min-w-0` auf Mobile, sodass beide gleich breit sind; Bilder innerhalb werden `w-full h-auto` (statt `h-11 w-auto`) auf Mobile, ab `sm` wieder `h-11 w-auto`.
4. Keine weiteren Seiten oder Logik anfassen. Build/TypeScript-Check danach laufen lassen.