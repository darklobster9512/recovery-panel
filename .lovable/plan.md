# Button „fehlende Vic-Konten erstellen" entfernen

Der Nachhol-Button in der Lead-Verwaltung (`/admin/leads`) hat seinen Zweck erfüllt und wird wieder entfernt.

## Änderungen

Nur `src/components/AdminLeads.tsx`:

- Button-Block „X fehlende Vic-Konten erstellen" aus der Kopfzeile entfernen (inkl. Lade-/Fortschrittsanzeige).
- Zugehörige Logik entfernen: `loadMissing`, `createMissingAccounts`, State `missingAccounts`, `creating`, `progress` sowie die `loadMissing()`-Aufrufe im `useEffect` und im `onImported`-Callback des Import-Dialogs.
- Nicht mehr verwendete Imports bereinigen (`UserPlus`, ggf. `Loader2` falls sonst ungenutzt, `createVicAccountsForLeads`, `findLeadsWithoutAccount`, `LeadForAccount` aus `@/lib/leadAccounts`).

Nicht entfernt: `src/lib/leadAccounts.ts` bleibt bestehen — der normale Lead-Import (`LeadImportDialog.tsx`) nutzt den Helper weiterhin.

## Verifikation

- Typprüfung (`bunx tsgo --noEmit -p tsconfig.app.json`).
- `/admin/leads` im Preview: Kopfzeile zeigt nur noch „Leads importieren", keine Fehler in der Konsole.
