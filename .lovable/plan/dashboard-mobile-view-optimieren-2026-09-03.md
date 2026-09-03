# /dashboard: Mobile View optimieren

## Ziel
Das gesamte `/dashboard` soll auf schmalen Viewports (bis ~640px) sauber aussehen: keine horizontalen Overflows, angemessene Schriftgrößen, komfortable Tap-Targets, kompakte Abstände und lesbare Detail- sowie Overview-Ansichten. Desktop-Layout bleibt unverändert.

## Betroffene Dateien
- `src/pages/Dashboard.tsx`
- `src/components/RecoveryGuide.tsx` (Padding/Font-Sizes auf Mobile)
- `src/components/RecoveryVisualization.tsx` (SVG bereits responsiv — nur Container-Padding/Header prüfen)
- `src/components/DocumentUpload.tsx` (Card-Padding und Buttons auf Mobile)

## Änderungen im Detail

### 1. Mobile Top-Bar
- Höhe bleibt `h-14`, Wordmark bleibt zentriert, Menü-Icon links.
- Zusätzliche `truncate`-Absicherung für den Wordmark bei kleinen Breiten.

### 2. Sheet-Sidebar (Mobile Menü)
- `SheetContent` von `w-72 p-6` auf `w-[85vw] max-w-xs p-5` — nutzt Bildschirm besser und lässt Rand für Close-Gesture.
- Innerhalb: Ansprechpartner-Karte, Vic-Info und Kooperationslogos bleiben; Abstände (`my-4`) auf Mobile auf `my-3` reduzieren, damit alles ohne Scrollen sichtbar bleibt.

### 3. Overview (Auftrags-Grid)
- Container: `px-6` → `px-4 sm:px-6`.
- Hero: `pt-16 pb-12` → `pt-8 pb-8 sm:pt-16 sm:pb-12`; H1 `text-4xl sm:text-5xl` → `text-2xl sm:text-4xl md:text-5xl`; Copy `text-base` → `text-sm sm:text-base`.
- Grid: `grid-cols-2 sm:grid-cols-3 gap-4` → `grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 pb-10 sm:pb-16`.
- Auftragskarten: `aspect-square` beibehalten, Logo `w-14 h-14` → `w-12 h-12 sm:w-14 sm:h-14`, Titel `text-sm` → `text-xs sm:text-sm` mit `line-clamp-2`.

### 4. Detail-View
- Wrapper: `max-w-2xl mx-auto w-full px-6 py-10` → `max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10`.
- Titelzeile: Logo `w-14 h-14` → `w-12 h-12 sm:w-14 sm:h-14`; H1 `text-2xl sm:text-3xl` bleibt, aber `break-words` statt `truncate` (sonst werden lange Titel abgeschnitten auf Mobile).
- Anleitung/Zugangsdaten/SMS-Cards: interne Paddings `px-4 py-3` bleiben; `text-sm` behalten. SMS-Absender + Datum in `flex-wrap` verpacken, damit lange Sender nicht überlaufen.
- Zugangsdaten- und Telefonwerte: `truncate` sicherstellen, Copy-Button-Opacity auf Mobile immer `opacity-100` (Hover existiert nicht auf Touch).
- Postident-Vorschau: `w-60 h-60` → `w-full max-w-[15rem] aspect-square h-auto`, Download-Button `w-full sm:w-auto`.
- App-Store-Badges: `h-10` → `h-9 sm:h-10`, `flex-wrap` bleibt.
- Zurück-Button: bleibt, `-ml-2` beibehalten.
- „Auftrag abschließen“-Button ist bereits `w-full` — ok.

### 5. RecoveryGuide (Anleitungsseite)
- Äußere Section: Padding auf Mobile reduzieren (`px-4 py-6` statt `px-8 py-12`), Überschriften `text-2xl sm:text-3xl`.
- Kontakt-/App-Store-Bereich: Buttons/Badges auf Mobile untereinander (`flex-col sm:flex-row`).

### 6. RecoveryVisualization
- Container: `px-4 sm:px-6`, Header-Titel `text-xl sm:text-2xl`.
- Stepper: horizontal scrollbar unterbinden — vertikale Auflistung auf `<sm`, horizontal ab `sm`.
- SVG bereits `w-full h-auto` — belassen.

### 7. DocumentUpload
- Karten-Padding `p-6` → `p-4 sm:p-6`; Buttons `w-full sm:w-auto`.

## Nicht im Scope
- Keine Backend-, Query- oder Auth-Änderungen.
- Keine Änderung am Desktop-Layout (Sidebar-Grid, sticky Card, Farben).

## Verifikation
- `bunx tsgo --noEmit` + `bun run build`.
- Preview auf 393×852 (aktueller Viewport) prüfen: keine horizontale Scrollbar, alle vier Reiter (Aufträge, Anleitung, Rückverfolgung, Dokumente) und die Detailansicht sauber lesbar.
