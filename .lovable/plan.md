# Admin Panel Redesign

Bring `/admin` visuell auf das Niveau des Referenzprojekts „vic-exploit": moderne, weiche Oberfläche mit sanftem Gradient-Hintergrund, Glass-Sidebar in Markenfarbe, elevated Cards mit Soft-Shadow und schöner Header-Bar. Nur Optik & Layout-Shell — keine Business-Logik-Änderungen.

## Was neu wird

**Design-Tokens (`src/index.css`)**
- Zusätzliche Tokens im HSL-Format ergänzen (bestehende bleiben kompatibel): `--surface`, `--surface-elevated`, `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring`.
- Gradients & Schatten: `--gradient-primary`, `--gradient-surface` (radiale Primary-Tints auf White), `--shadow-card`, `--shadow-card-hover`, `--shadow-elegant`, `--shadow-soft`.
- Radius auf `0.75rem` anheben (weichere Ecken, wie Referenz).
- Sidebar-Farbe = weißes Glas mit ~6% Primary-Tint; Muted/Accent leicht mit Primary getönt.

**Tailwind-Config**
- `boxShadow.card`, `boxShadow.cardHover`, `boxShadow.elegant`, `backgroundImage.gradient-primary`, `backgroundImage.gradient-surface`, `colors.sidebar.*` registrieren, damit Utilities wie `bg-sidebar`, `shadow-card` funktionieren.

**Admin-Shell (`src/pages/AdminPanel.tsx`)**
- Umbau auf shadcn `SidebarProvider` / `Sidebar` / `SidebarInset` (bereits vorhanden unter `src/components/ui/sidebar`).
- Sidebar: Glass-Look (`bg-sidebar` + Backdrop-Blur), Logo-Tile mit `gradient-primary`, Gruppen-Labels (Overview · Vertrieb · Betrieb · System), aktive Nav-Items mit `bg-sidebar-primary text-sidebar-primary-foreground shadow-sm`, hover subtil in Primary-Tint. Collapsible auf `icon`.
- Footer der Sidebar: Avatar mit Initialen, Email + Rolle, Logout als Icon-Button.
- Sticky Top-Bar (`h-14`, `backdrop-blur-xl`, `bg-background/70`, `border-b`): SidebarTrigger, Divider, dynamischer Seitentitel, rechts Platz für Actions (später).
- Main-Bereich: `background: var(--gradient-surface)` statt flach grau; Content-Container `p-6 lg:p-8`.
- Seiten-Titel-Map extrahieren in kleines Objekt statt der langen Ternary-Kette.

**Card-Komponenten (nur Klassen anpassen, keine Struktur)**
- Wo Admin-Panels Stat-/Content-Cards rendern (AdminDashboard, AdminLeads-Header, AdminVics-Header, AdminSettings-Sections), Karten auf `rounded-2xl border border-border/60 bg-card shadow-card hover:shadow-card-hover transition` heben. Nur die äußeren Wrapper-Klassen, keine Datenlogik.
- Buttons „Primary"-CTAs erhalten optional `bg-gradient-to-r from-primary to-primary/80 shadow-soft` in den Admin-Headern.

## Was nicht angefasst wird

- Keine Änderungen an Datenmodell, Queries, Edge Functions, Routing-Struktur oder /dashboard-Ansicht.
- Bestehendes Light-only-Theme bleibt; kein Dark-Mode-Toggle.
- Text- und Feld-Inhalte bleiben identisch.

## Technische Details

Dateien, die editiert werden:
- `src/index.css` — Tokens, Gradients, Shadows, Sidebar-Vars.
- `tailwind.config.ts` — Sidebar-Farben, Shadows, Background-Images registrieren.
- `src/pages/AdminPanel.tsx` — Shell auf `SidebarProvider` umstellen, Header + Gradient-Main.
- `src/components/AdminDashboard.tsx`, `AdminLeads.tsx`, `AdminVics.tsx`, `AdminSettings.tsx`, `AdminVerifications.tsx`, `AdminEmailTemplates.tsx` — nur Wrapper-Klassen der obersten Cards/Sections angleichen (rounded-2xl, shadow-card, border/60). Keine Logik.

Neue Dateien: keine.

Migrationen / Edge Functions: keine.

Verifikation: Typecheck; Playwright-Screenshot von `/admin`, `/admin/leads`, `/admin/vics`, `/admin/einstellungen` zur visuellen Prüfung.
