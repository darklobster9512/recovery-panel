# Angeforderte Verifikationen: Karten nur so breit wie nötig

- Die Karten unter „Angeforderte Verifikationen“ nehmen nicht mehr die volle Breite ein, sondern passen sich ihrem Inhalt an (Name, Datum, Eigene Bank, Status, Logos).
- Mehrere Karten stehen nebeneinander und brechen in die nächste Zeile um, wenn kein Platz mehr ist.

## Technisch
- `RequestVerificationsSection.tsx`: Container von `grid gap-2` auf `flex flex-wrap items-start gap-2`, Karten `w-fit max-w-full`; Status-Badge mit etwas Abstand (`gap-4`) neben dem Namen statt `justify-between` über die ganze Breite.
