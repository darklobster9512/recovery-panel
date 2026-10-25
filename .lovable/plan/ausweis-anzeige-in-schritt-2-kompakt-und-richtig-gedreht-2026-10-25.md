# Ausweis-Anzeige in Schritt 2: kompakt und richtig gedreht

## Was sich ändert
- **Platz:** Vorder- und Rückseite teilen sich zusammen die Höhe, die bisher ein Bild hatte (ca. 50/50 oben und unten). Jedes Bild wird darin vollständig eingepasst.
- **Automatisch drehen:** Ein Ausweis ist immer querformatig. Ist ein Foto hochkant (wie bei Annette Bringezu), wird es automatisch um 90° ins Querformat gedreht.
- **Von Hand nachdrehen:** Ob ein hochkant fotografierter Ausweis nach links oder rechts gedreht werden muss, lässt sich nicht sicher erkennen. Deshalb gibt es pro Bild einen kleinen Drehen-Knopf (90° weiter) in der Bildzeile, falls er noch auf dem Kopf oder seitlich steht.
- Ein Klick aufs Bild öffnet es weiterhin groß in neuem Tab.

## Technisch
- `RequestVerificationsSection.tsx`: Bildbereich je Seite `h-44` (zusammen ≈ bisherige Einzelhöhe), `object-contain`.
- Bild beim Laden per `naturalWidth/naturalHeight` prüfen; hochkant → Startrotation 90°. State `rotation[side]`, Knopf `RotateCw` addiert 90°.
- Darstellung: bei 90°/270° wird das Bild mit getauschter Breite/Höhe per CSS `transform: rotate()` in den Rahmen eingepasst.
- Nur Anzeige; gespeicherte Dateien bleiben unverändert.
