# Admin Cards an neues Design anpassen

Die Cards im Admin-Panel nutzen aktuell noch `bg-white` mit `border-gray-200` und wirken dadurch flach vor dem neuen Gradient-Hintergrund. Ich vereinheitliche sie auf das im letzten Schritt eingeführte Token-Set (`--surface-elevated`, `--shadow-card`, `border/60`), damit sie sich sauber in die Glass-/Gradient-Optik einfügen.

## Änderungen

- Neue Utility-Klassen bzw. Tailwind-Aliase nutzen: `bg-card`, `border border-border/60`, `shadow-card`, `rounded-2xl`, `backdrop-blur-sm`.
- `bg-white` / `border-gray-200` / `shadow-none` in allen Admin-Komponenten ersetzen:
  - `AdminDashboard.tsx` (Stat-Cards + große Panels)
  - `AdminSettings.tsx`
  - `AdminEmailTemplates.tsx` (Preview-iframe behält weißen Hintergrund — E-Mail-Look)
  - `AdminVerifications.tsx` (Grid-Cards + "Neu"-Kachel, aktive Tab-Pille)
  - `AdminLeads.tsx` (sticky Zellen-Hintergrund an Card-Ton)
  - `AdminDocuments.tsx`
  - `AdminReview.tsx`
  - `AdminAssignmentHistory.tsx` (Border auf `border-border/60`)
- Hover-States der "Neu"-Kachel und Tab-Pillen auf semantische Primary-Tokens umstellen (statt `hsl(221,100%,50%)`).
- Sticky `Aktionen`-Zelle in Leads-Tabelle bekommt `bg-card` statt `bg-white`, damit sie mit der neuen Card-Fläche verschmilzt.

## Technische Details

- Keine neuen Tokens nötig — nutzen die im vorigen Schritt gesetzten `--surface-elevated`, `--shadow-card`, `--sidebar-*`.
- Reine Klassen-Ersetzungen, keine Logik- oder Datenänderungen.
- iframe in E-Mail-Preview bleibt bewusst weiß (repräsentiert die echte Mail).
