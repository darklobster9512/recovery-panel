# Livechat: Scrollbars im Stil des Panels

Im Livechat (Chatliste, Nachrichtenverlauf, Vorlagenliste) werden die Scrollbars schmal, abgerundet und farblich ans Design angepasst:
- Heller Modus: dezent grau, beim Darüberfahren blau.
- Dunkler Modus: dunkles Grau, beim Darüberfahren hellblau.
- Die Schiene ist unsichtbar, damit nur der Schieber zu sehen ist.

## Technisch
- `src/index.css`: neue Hilfsklasse `.scrollbar-brand` (6 px breit, Daumen `hsl(var(--border))`, beim Hover `hsl(var(--primary))`, transparente Schiene, `scrollbar-width: thin` für Firefox).
- `AdminLivechat.tsx`: Klasse an den drei scrollbaren Bereichen ergänzen (Zeilen 341, 447, 534).
