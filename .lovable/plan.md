# E-Mail-Footer kompakter gestalten

Den Footer der E-Mail-Vorlage in `/admin/emails` von einer Zeile pro Information auf 1–2 Zeilen reduzieren.

## Änderung

- In `src/lib/emailTemplates.ts` werden die Footer-Elemente nicht mehr als einzelne `<div>`-Blöcke untereinander gerendert, sondern in einer kompakten Zeile bzw. zwei Zeilen gruppiert:
  - Zeile 1: Korte & Partner | Domstraße 15 | 20095 Hamburg | Telefon: 040 573086460
  - Zeile 2: E-Mail: info@korte-kanzlei.de | Dr. Thomas Korte | DE317391938
- Visueller Stil bleibt Kanzlei-typisch, Trennung z.B. durch mittlere Punkte oder senkrechte Striche.
- Keine Änderungen an anderen Komponenten, Routes, Datenbank oder Edge Functions.

## Betroffene Dateien

- `src/lib/emailTemplates.ts` (Footer-Rendering)
- `src/components/AdminEmailTemplates.tsx` nicht direkt betroffen, siehe gegebenenfalls Preview-Höhe anpassen, falls nötig
