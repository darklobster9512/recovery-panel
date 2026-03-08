

# E-Mail in der mobilen Sidebar anzeigen

## Änderung in `src/pages/Dashboard.tsx`

1. **Profil-Query erweitern** (Zeile 79): `email` zusätzlich zu `first_name, last_name` laden und in neuem State `profileEmail` speichern.

2. **Sidebar ergänzen** (Zeile 263-265): Unter dem Namen die E-Mail-Adresse anzeigen als kleinerer, grauer Text.

```text
Sidebar:
┌──────────────┐
│  Max Müller   │
│  max@test.de  │  ← neu
│ ──────────── │
│  Abmelden    │
└──────────────┘
```

### Dateien
- `src/pages/Dashboard.tsx`

