# „Aktuelle Bank“ als reines Freitextfeld

- Das Feld „Aktuelle Bank“ zeigt keine Vorschlagsliste mehr, nur noch freie Eingabe. Der Platzhaltertext bleibt.

## Technisch
- `RequestVerificationsSection.tsx`: `<datalist id="bank-options">`, das `list`-Attribut am Input und die ungenutzte `banks`-Berechnung entfernen; `autoComplete="off"` setzen, damit auch der Browser keine Vorschläge einblendet.
