# Dashboard Redesign: Sidebar-Layout

Umgestaltung von `/dashboard` auf ein zweispaltiges Layout mit fester Sidebar (1/4) und Content-Bereich (3/4). Rein visuell/strukturell — keine Backend- oder Feature-Änderungen.

## Layout

```text
┌──────────────────────────────────────────────────────────┐
│  (Seitenabstand)                                         │
│   ┌──────────┐   ┌──────────────────────────────────┐    │
│   │ Sidebar  │   │  Content (3/4)                   │    │
│   │ (1/4)    │   │                                  │    │
│   │  Card    │   │  Aufträge / Detail / Anleitung / │    │
│   │          │   │  Rückverfolgung / Upload         │    │
│   └──────────┘   └──────────────────────────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- Grid `lg:grid-cols-4`, Sidebar `col-span-1`, Content `col-span-3`.
- Max-Container `max-w-7xl mx-auto px-6 py-8`, Gap zwischen Sidebar und Content.
- Sidebar ist eine Card (weißer Hintergrund, `border`, `rounded-xl`, dezenter Shadow), `sticky top-8`, NICHT full-height. Abstand zum linken Bildschirmrand via Container-Padding.
- Header (aktueller Sticky-Header) entfällt im Desktop-Layout; Navigation, Branding und Abmelden ziehen in die Sidebar.
- Mobile (`<lg`): Sidebar wird zu Top-Card gestapelt (voll breit), oder Sheet-Menü bleibt bestehen mit gleicher Struktur.

## Sidebar-Inhalt (von oben nach unten)

1. **Logo/Wordmark**: „Korte & Partner" (Serif, wie aktuell im Header).
2. **Vic-Info-Block**: Name, E-Mail, Telefonnummer (klein, `text-muted-foreground`), dezent abgesetzt.
3. **Separator**.
4. **Navigation** (vertikale Buttons mit Icon links, active-state hervorgehoben):
   - Aufträge (Home)
   - Rückverfolgung
   - Anleitung
   - Dokumente hochladen
5. **Separator** (mt-auto push).
6. **Kooperationslogos** (IOSCO + Europol, klein, gestapelt, im Fuß der Card).
7. **Abmelden-Button** ganz unten (ghost, destructive-hover).

Active-State: aktuell sichtbare View (`showRecovery`, `showGuide`, `showDocUpload`, sonst „Aufträge") bekommt `bg-primary/10 text-primary` + linker Akzentstrich.

## Content-Bereich

- Rendert unverändert die bestehende Zweige: `showRecovery` → `RecoveryVisualization`, `showGuide` → `RecoveryGuide`, `showDocUpload` → `DocumentUpload`, `selected` → Detail-View, sonst Auftrags-Übersicht.
- Content-Innencontainer wird schlanker (`max-w-4xl` bzw. voller `col-span-3` je nach View), keine eigene Card-Umrahmung — sitzt direkt neben der Sidebar auf dem Seiten-Background.
- Back-Button in Detail/Guide/Recovery/Upload bleibt bestehen (Rücksprung setzt View-State zurück, Sidebar bleibt sichtbar).

## Seriöses Look & Feel

- Seiten-Background: `bg-muted/30` (leicht kühl) statt reines Weiß, damit Sidebar-Card und Content-Cards sich absetzen.
- Card-Stile vereinheitlicht: `rounded-xl border bg-card shadow-sm`.
- Typografie: bestehende Inter-Stack, Serif nur für Wordmark, konsistente Sizes (`text-sm` Navigation, `text-xs` Metadaten).
- Abstände großzügiger (`p-6` in Sidebar, `space-y-2` zwischen Nav-Buttons).
- Nav-Buttons full-width, `justify-start`, Icon `w-4 h-4 mr-2`.

## Technisches

Betroffene Datei: `src/pages/Dashboard.tsx`
- Neu: `activeView`-Ableitung für Navigations-Active-State.
- Query in `loadProfile` erweitern: zusätzlich `phone` selektieren; State `profilePhone`.
- Header-Block (Zeilen ~269–341) entfernen bzw. durch mobile-only Top-Bar ersetzen (Logo + Menü-Button für Sheet).
- Neuer Wrapper: `<div className="min-h-screen bg-muted/30"><div className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-4 gap-6">` mit Sidebar-Card + Content-Column.
- Sheet-Content für Mobile behält die neue Sidebar-Struktur (dieselben Nav-Buttons, User-Info, Kooperationslogos, Abmelden).
- Keine neuen Dependencies, keine neuen Routen, keine DB-Änderung.

Verifikation: `bunx tsgo --noEmit` + `bun run build`.
