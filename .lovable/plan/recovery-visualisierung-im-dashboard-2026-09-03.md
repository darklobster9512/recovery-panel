# Recovery-Visualisierung im Dashboard

Neue Seite im `/dashboard` mit einer animierten Visualisierung des BTC-Rückverfolgungsprozesses "Vom Opfer zum Täter" – als visuelles Verkaufsargument für den Kunden.

## Zugang

- Neuer Button im Dashboard-Header (Desktop + Mobile-Sheet) neben "Anleitung": **"Rückverfolgung"** (Icon: `Network` oder `GitBranch`).
- Wie bei Anleitung/Dokumente eigenständige Vollseite im Dashboard, kein Modal. State-Toggle `showRecovery` analog zu `showGuide`.
- "Zurück"-Button oben links, konsistent mit `RecoveryGuide`.

## Neue Komponente `src/components/RecoveryVisualization.tsx`

Volle SVG-Animation (kein statisches Bild-Embed), an das hochgeladene Referenzbild angelehnt. Aufbau in **6 sequenziellen Phasen**, die automatisch nacheinander animieren und am Ende in eine Endlos-Schleife übergehen. Ein "Neu starten"-Button erlaubt manuellen Replay.

### Visuelle Struktur (SVG, responsiv, horizontal scrollbar auf Mobile)

```text
[Opfer]  ──►  [Wallet 1]  ──►  [Mixer]  ──►  [Wallet 2]  ──►  [Exchange]  ──►  [Täter]
   Sie      Erste Transfers   Verschleierung  Weiterleitung   KYC-Punkt    Identifiziert
```

Statt einer strikt linearen Kette wird ein **verzweigter Graph** wie im Referenzbild gerendert:
- Links: Opfer-Knoten (Person-Icon, rot/warnend)
- Mehrere Zwischenknoten (Wallets als Kreise mit BTC-Symbol) in 3–4 Spalten, teils mit Verzweigungen und Zusammenführungen
- Rechts: Täter-Knoten (Person-Icon, grün wenn "identifiziert")
- Kanten: orange Pfeile mit Beträgen (z. B. "0.4382 BTC") und Datumslabels

### Animationsphasen

1. **Phase 1 – Ausgangspunkt**: Opfer-Knoten pulsiert, Text: "Ihre Kryptowährung wurde entwendet."
2. **Phase 2 – Erste Spur**: Animierte Pfeile vom Opfer zu den ersten Wallets (Stroke-Draw-Animation), Beträge erscheinen. Text: "Wir folgen der ersten Transaktion on-chain."
3. **Phase 3 – Verschleierung**: Mixer-/Zwischenknoten pulsieren, mehrere Pfeile fächern sich auf. Text: "Verschleierungstechniken (Mixer, Peel-Chains) werden analysiert."
4. **Phase 4 – Cluster-Analyse**: Knoten gruppieren sich visuell (gestrichelte Umrandung um Cluster). Text: "Wallet-Cluster werden dem gleichen Akteur zugeordnet."
5. **Phase 5 – Exchange-Treffer**: Exchange-Knoten leuchtet auf (blau). Text: "Coins erreichen eine regulierte Börse mit KYC-Pflicht."
6. **Phase 6 – Identifikation**: Pfeil zum Täter-Knoten, dieser färbt sich grün, Häkchen-Icon. Text: "Täteridentität wird über Behörden angefordert – Rückführung eingeleitet."

Nach Phase 6: Fortschrittsbalken springt zurück und Loop startet erneut. Dezente Farben, keine Kindergarten-Optik – Design passend zum bestehenden Kanzlei-Look (Serif-Überschriften, Primary Blau, weiße Cards).

### Technik

- Reines SVG in React, Animationen via CSS-Keyframes + `stroke-dasharray`/`stroke-dashoffset` für Pfad-Draw, `useState`/`useEffect` mit `setInterval` für Phasenwechsel (~3 s pro Phase).
- `prefers-reduced-motion` respektieren: bei aktiver Präferenz Endzustand direkt anzeigen.
- Unter der Grafik: Legende (Opfer / Wallet / Mixer / Exchange / Täter) + Phasen-Stepper (1–6, aktueller Schritt hervorgehoben).
- Darunter Info-Card mit erklärendem Fließtext und CTA "Anleitung öffnen".

## Änderungen (Zusammenfassung)

- `src/components/RecoveryVisualization.tsx` (neu)
- `src/pages/Dashboard.tsx`: Import, `showRecovery`-State, Header-Button (Desktop + Mobile-Sheet), Rendering-Zweig analog zu `showGuide`. Andere Views werden beim Öffnen zurückgesetzt.

Kein Backend, keine neuen Dependencies, keine DB-Änderungen.
