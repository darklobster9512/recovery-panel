

# Mobile/Tablet Header: Logo zentriert + Hamburger-Sidebar

## Übersicht
Auf Mobile und Tablet wird der Header umgebaut: Logo mittig zentriert, links ein Hamburger-Icon das eine Sheet-Sidebar öffnet mit Nutzername und Abmelden-Button. Auf Desktop bleibt das aktuelle Layout bestehen.

## Änderungen in `src/pages/Dashboard.tsx`

### 1. Imports ergänzen
- `Menu` Icon von lucide-react importieren
- `Sheet, SheetContent, SheetTrigger` importieren
- `useState` für Sheet-State (oder direkt Sheet-eigenes open/close nutzen)

### 2. Header-Markup (Zeile 234-247)

**Desktop (md+):** Bleibt wie bisher – Logo links, Name + Abmelden rechts.

**Mobile/Tablet (<md):** 
- Links: Hamburger-Button (`Menu` Icon)
- Mitte: Logo (zentriert via `absolute left-1/2 -translate-x-1/2` oder flexbox)
- Rechts: leer (oder unsichtbarer Platzhalter für Symmetrie)

### 3. Sheet-Sidebar für Mobile
- Wird durch Hamburger-Button geöffnet (Seite: links)
- Inhalt: Nutzername (`profileName`) oben, darunter Separator, dann Abmelden-Button
- Schließt sich nach Abmelden automatisch

### Struktur (vereinfacht)
```text
Mobile Header:
[☰]          [LOGO]          [   ]

Sheet (links):
┌──────────────┐
│  Max Müller   │
│ ──────────── │
│  Abmelden    │
└──────────────┘

Desktop Header (unverändert):
[LOGO]              [Max Müller] [Abmelden]
```

### Technischer Ansatz
- Responsive Klassen: `hidden md:flex` für Desktop-Elemente, `flex md:hidden` für Mobile-Elemente
- Sheet-Komponente (bereits im Projekt vorhanden) für die mobile Sidebar
- Keine neue Datei nötig – alles inline im Dashboard-Header

