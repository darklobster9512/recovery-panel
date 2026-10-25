# Zuweisen-Button rechts neben dem Text

```text
+-------------------------------------------------+
| [ Logo ]  Deutsche Bank       [  👤+  ]     [✎] |
| [ 56px ]  Postident           [Zuweisen]        |
+-------------------------------------------------+
```

- „Zuweisen“ wird ein quadratischer Button, genauso groß wie das Logo (56 px), zwischen Text und Stift.
- Im Button: großes Person-Plus-Symbol, darunter ganz kleiner Text „Zuweisen“.
- Der breite Button unten fällt weg, die Kachel wird eine kompakte Zeile.
- Der Stift zum Bearbeiten bleibt oben rechts.

## Technische Details
- Nur Kachel-Markup in `src/components/AdminVerifications.tsx`: Zeile `flex items-center gap-3` = Logo `h-14 w-14` | Textblock `flex-1` | Button `h-14 w-14 flex-col` mit `UserPlus h-6 w-6` und `text-[10px]` Label | Stift `self-start`.
