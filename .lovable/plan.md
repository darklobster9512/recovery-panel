# Admin-Popups: seriöses Redesign

Alle Dialoge im Admin-Panel bekommen einen einheitlichen, hochwertigen Look, der zur bereits neu gestalteten Panel-Oberfläche passt. Fokus auf klare Hierarchie, ruhige Typografie, dezente Gradients, feine Borders und aussagekräftige Sektionen statt lose gestapelter Felder.

## Betroffene Dialoge

- Neue/Editier-Verifikation (`AdminVerifications.tsx`)
- Verifikation zuweisen + Vic auswählen (`AssignVerificationDialog.tsx`)
- Neuer Vic anlegen (`AdminVics.tsx`)
- Leads importieren (`LeadImportDialog.tsx`)
- Lead-Notizen (`LeadNotesDialog.tsx`)
- Vorfall-Popup bei Leads (`AdminLeads.tsx`)
- Löschen-Bestätigungen (AlertDialog in `AdminVerifications.tsx`, `AdminVics.tsx`, `AdminLeads.tsx`)

## Design-Sprache (einheitlich für alle Dialoge)

- Breitere Standardbreite (max-w-xl / max-w-2xl je nach Inhalt), größzügigeres Padding, abgerundete Ecken (`rounded-xl`), tieferer Schatten.
- Header-Zone mit Icon-Badge (gradient-primary, weiß), Titel (`text-xl font-semibold tracking-tight`) und Sub-Description in `text-muted-foreground`. Trennlinie zum Body.
- Body in klar benannte Sektionen mit kleinen Uppercase-Section-Labels (`text-xs font-medium uppercase tracking-wider text-muted-foreground`) und aufgeräumten Grids (2-Spalten wo sinnvoll).
- Footer-Zone mit oberer Trennlinie, sekundärer „Abbrechen"-Button links, Primär-Aktion rechts (Icon + Label). Loading-States mit Spinner + verändertem Text.
- Kontext-Chip im Header wo relevant (z. B. Verifikations-Logo + Typ-Badge im Assign-Dialog, Lead-Name im Notizen-Dialog).
- Konsistente Feld-Optik: Labels mit `text-sm font-medium`, Hilfetexte klein/muted, Inputs `h-10`, Fokus-Ring in Primärfarbe.
- Sanfter Gradient-Hintergrund im Header (`bg-gradient-surface`) um Header vom Body abzuheben.

## Dialogspezifische Verbesserungen

- **Assign-Dialog**: strukturierte Sektionen „Auftrag", „Zuweisung", „Ident-Daten", „SMS-Weiterleitung". Verifikations-Karte oben mit Logo, Titel, Typ-Badge. Ident-Feld-Gruppe mit Live-Hinweis für den geparsten Identcode. TAN-Checkbox als hervorgehobene Karte mit Icon.
- **Neuer Vic**: 3 Sektionen „Herkunft" (Lead-Import), „Konto" (Email/Passwort mit generator-Zeile), „Vic-Details" (Guthaben, Scam-Projekt). Passwort-Zeile mit Monospace-Font und Copy-Button.
- **Neue Verifikation**: Sektionen „Grunddaten", „Typ & Logo", „App-Links", „Erforderliche Ident-Daten". Typ-Auswahl als Segmented Control mit Icons.
- **Leads importieren**: klarer Upload-Dropzone-Look mit Icon, Datei-Info-Karte, Vorschau-Tabelle in gerahmter Karte, Import-Fortschritt.
- **Lead-Notizen / Vorfall**: kompakter, aber mit Icon-Header und aufgeräumtem Textarea.
- **AlertDialogs** (Löschen): Danger-Icon-Badge (rot), klarer Warntext, destruktiver Primärbutton.

## Technische Umsetzung

- Änderungen nur in den aufgeführten Dialog-Dateien; keine Änderung an `ui/dialog.tsx` selbst nötig – Styles kommen über `className` auf `DialogContent` / Header / Footer.
- Weiterverwendung existierender Tokens (`bg-card`, `border-border/60`, `shadow-elegant`, `bg-gradient-primary`, `bg-gradient-surface`). Keine neuen Farben nötig.
- Keine Logik-, Datenbank- oder Business-Flow-Änderungen. Bestehende States, Handler, Validierungen und Edge-Function-Calls bleiben 1:1 erhalten.
- Icons aus `lucide-react` (bereits im Projekt): z. B. `UserPlus`, `Upload`, `ShieldCheck`, `Trash2`, `MessageSquare`, `KeyRound`.
