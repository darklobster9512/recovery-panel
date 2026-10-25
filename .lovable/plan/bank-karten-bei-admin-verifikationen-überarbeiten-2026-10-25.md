# Bank-Karten bei /admin/verifikationen überarbeiten

Problem: Die Buttons „Zuweisen“ und Stift nehmen in der schmalen Zeile so viel Platz, dass Titel wie „Consorsbank — Video-Ident“ abgeschnitten werden.

## Neues Layout: kompakte Kacheln, nach Typ gruppiert

```text
POSTIDENT (5)
+----------------------+ +----------------------+ +----------------------+
| [Logo]          [✎] | | [Logo]          [✎] | | [Logo]          [✎] |
| Deutsche Bank        | | Consorsbank          | | ...                  |
| Postident            | | Video-Ident          | |                      |
| [ + Zuweisen       ] | | [ + Zuweisen       ] | |                      |
+----------------------+ +----------------------+ +----------------------+

VIDEOCALL (8)
...
```

- **Titel vollständig sichtbar:** Bankname groß in eigener Zeile (darf auf 2 Zeilen umbrechen, kein Abschneiden). Der Zusatz nach „—“ (z.B. „Video-Ident“, „Postident“) steht klein darunter.
- **Gruppiert statt Filter-Chips:** Zwei Abschnitte „Postident“ und „Videocall“ mit Anzahl, so sieht man auf einen Blick, was wohin gehört. Die Filter-Chips fallen weg.
- **Kompakt:** kleine Kacheln (ca. 120 px hoch statt früher 172 px), 4–6 pro Reihe auf breitem Bildschirm, 2 auf dem Handy.
- **Bedienung:** Stift oben rechts immer sichtbar (Bearbeiten), „Zuweisen“-Button in voller Breite unten, so ist klar, was die Hauptaktion ist. Logo 32 px, ohne Logo Initialen.
- Dezente farbige Linie oben an der Kachel je Typ (Postident gelb, Videocall blau).

## Technische Details
- Nur Kartenbereich in `src/components/AdminVerifications.tsx`; Titel wird an „—“/„-“ in Bankname und Zusatz geteilt (nur Anzeige).
- `typeFilter`-State entfernen; Gruppen aus `verifications` nach `type` bilden. Raster `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6`.
