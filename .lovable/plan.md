# Dashboard-Farbwelt an Anleitungsseite angleichen

Das gesamte `/dashboard` erhält dieselbe seriöse Kanzlei-Farbwelt wie `RecoveryGuide.tsx`:

- Navy `#0b1f3a` als dominante Akzent-/Kopffarbe
- Gold `#c9a24a` als feiner Akzent (Linien, kleine Labels)
- Weiß / `slate-50` als Flächen, `slate-700` als Fließtext, `slate-200` als Rand

## Was geändert wird (nur Optik, keine Logik)

1. **Sidebar-Card (`src/pages/Dashboard.tsx` → `SidebarInner`)**
   - Card-Hintergrund weiß mit `border-slate-200`, dezenter Shadow
   - Logo-Wordmark in `text-[#0b1f3a]`, `&` in `text-[#c9a24a]`
   - Feine Goldlinie (`bg-[#c9a24a]/60`) unter dem Logo statt neutraler Separator
   - Ansprechpartner-Card: Fläche `bg-slate-50`, Name `text-[#0b1f3a]`, Meta `text-slate-600`, Avatar-Rand `border-[#0b1f3a]/20`
   - Navigation:
     - Inaktiv: `text-slate-700 hover:bg-slate-100 hover:text-[#0b1f3a]`
     - Aktiv: `bg-[#0b1f3a] text-white` mit goldenem Left-Border `border-l-2 border-[#c9a24a]`
   - Vic-Info-Card: `bg-slate-50`, Name `text-[#0b1f3a]`, Meta `text-slate-600`, Guthaben-Zeile mit `text-[#c9a24a]` Label
   - Abmelden: `text-slate-600 hover:text-[#0b1f3a] hover:bg-slate-100`
   - Separatoren als `bg-slate-200` (bzw. Gold-Hairline über „In Kooperation mit“)
   - „In Kooperation mit“-Label in `text-slate-500`

2. **Content-Bereich (`Dashboard.tsx`)**
   - Seiten-Hintergrund `bg-slate-50` (statt aktuellem Muted)
   - Alle Content-Cards (Aufträge, Auftrags-Detail, leere Zustände): `bg-white border-slate-200`, Überschriften `text-[#0b1f3a]`, Fließtext `text-slate-700`, Meta `text-slate-500`
   - Status-Badges und Highlight-Akzente auf Navy/Gold gemappt (Erfolg bleibt grün, Warnung bleibt amber – nur neutrale Akzente umfärben)
   - Primär-Buttons (z. B. „Auftrag abschließen“): `bg-[#0b1f3a] hover:bg-[#0b1f3a]/90 text-white`
   - Sekundär-/Ghost-Buttons: `border-slate-200 text-[#0b1f3a] hover:bg-slate-100`

3. **`RecoveryVisualization.tsx`**
   - Kartenrahmen `bg-white border-slate-200`
   - Knoten/Kanten-Palette auf Navy (`#0b1f3a`) mit Gold-Akzent (`#c9a24a`) statt aktueller Blau/Orange-Mischung
   - Phasen-Stepper aktiv: `bg-[#0b1f3a] text-white`, inaktiv `text-slate-500`
   - Legenden-/Infotexte `text-slate-700`

4. **`DocumentUpload.tsx`**
   - Karten weiß, Überschriften Navy, Fließtext `slate-700`
   - Upload-Dropzone: `border-dashed border-slate-300 hover:border-[#0b1f3a] bg-slate-50`
   - Primärbutton Navy, Sicherheitshinweise mit `text-[#c9a24a]` Label

5. **Mobile Sheet-Sidebar**
   - Sheet-Hintergrund weiß, gleiche Farblogik wie Desktop-Sidebar

## Was NICHT geändert wird

- Keine Struktur-/Layout-Änderungen, kein Umbau der Sidebar-Reihenfolge
- Keine Änderungen an Daten, Queries, Routing, Storage, Edge Functions
- Anleitungsseite (`RecoveryGuide.tsx`) bleibt unverändert – sie ist die Referenz
- Admin-Panel bleibt unverändert

## Technische Details

- Farben werden direkt als Tailwind-Utilities mit Hex-Werten (`bg-[#0b1f3a]`, `text-[#c9a24a]`) gesetzt, konsistent zur bereits existierenden `RecoveryGuide.tsx`. Keine neuen CSS-Tokens in `index.css`, damit das Admin-Design unberührt bleibt.
- Nach den Edits: `bunx tsgo --noEmit` und `bun run build` zur Absicherung.
