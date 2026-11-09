# Neuer Reiter "Anweisung"

## Was du bekommst
- Neuer Menüpunkt **Anweisung** im Admin-Panel – sichtbar für Admins, Manager und Caller.
- **Als Admin:** Ein Editor wie in einem Forum: Fett, Kursiv, Unterstrichen, Überschriften, Listen, Zitate, Links, Trennlinie und **Bilder einfügen** (hochladen oder per Einfügen/Ziehen). Button **Speichern**, darunter "Zuletzt geändert am …".
- **Als Manager/Caller:** Dieselbe Seite zeigt nur den fertigen Text mit allen Formatierungen und Bildern – ohne Bearbeiten.
- Eine gemeinsame Anweisung für alle (nicht pro Marke).

## Technische Details
- Tabelle `instructions` (eine Zeile: `content` HTML, `updated_by`, `updated_at`); Lesen für admin/manager/caller, Schreiben nur admin (RLS via `has_role`).
- Bilder: privater Bucket `instruction-images` (Upload nur Admin, Lesen für Staff), Anzeige über signierte URLs; im HTML wird der Pfad gespeichert.
- Editor mit TipTap (`@tiptap/react`, StarterKit, Image, Link, Underline); Anzeige read-only mit gleichem Styling; HTML vor Anzeige mit DOMPurify bereinigt.
- Neue Komponente `AdminInstructions.tsx`, Route `/admin/anweisung` in `AdminPanel.tsx`, in `MANAGER_PATHS` (`roles.ts`) ergänzt + Test in `roles.test.ts`; Caller-Menü erhält den Eintrag ebenfalls.
