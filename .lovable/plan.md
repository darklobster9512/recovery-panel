

# Dashboard: Breiterer Text + Nutzername im Header

## Änderungen

### 1. Profil laden (`src/pages/Dashboard.tsx`)
- Neuen State `profile` mit `first_name` / `last_name` hinzufügen
- Beim Laden (neben `loadAssignments`) Profil aus `profiles`-Tabelle abfragen
- Im Header rechts neben dem Logo den Namen anzeigen: `Vorname Nachname`

### 2. Header anpassen (Zeile 218-225)
- Zwischen Logo und Abmelden-Button den Nutzernamen einfügen
- Layout: Logo links, Name + Abmelden rechts (mit `gap-3` gruppiert)

### 3. Text breiter machen (Zeile 409)
- `max-w-2xl` → `max-w-3xl` damit der erste Satz auf Desktop in eine Zeile passt

### Dateien
- `src/pages/Dashboard.tsx`

