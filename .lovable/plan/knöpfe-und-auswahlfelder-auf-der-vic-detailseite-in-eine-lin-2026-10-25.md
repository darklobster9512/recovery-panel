# Knöpfe und Auswahlfelder auf der Vic-Detailseite in eine Linie

## Ursache
Der Kopfbereich des Profil-Kastens gibt jedem zweiten Element automatisch etwas Abstand nach oben. Dadurch rutscht die rechte Knopfgruppe nach unten. Außerdem sind die Elemente unterschiedlich hoch: Auswahlfelder 36 px, Knöpfe 32 px.

## Änderungen
- Name, Status, Branding, Caller-Zuweisung, „Ihr Fall Email neu senden“ und „Bearbeiten“ stehen mittig auf einer Linie.
- Alle Knöpfe und Auswahlfelder sind gleich hoch (36 px) und gleich abgerundet.
- Bei schmalem Fenster rutschen sie sauber in die nächste Zeile, ohne Versatz.

## Technisch
- `AdminVicDetail.tsx`: `CardHeader` mit `space-y-0 items-center flex-wrap`; Branding-`select` und Buttons auf `h-9 rounded-xl`; ggf. `AssignCallerSelect`/`VicStatusSelect`-Trigger per `className` auf `h-9` angleichen.
