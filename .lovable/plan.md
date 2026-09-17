# Nachholen: heutiges Datum + Vic-Konten mit E-Mail und SMS

## Was schiefgelaufen ist

Die 38 Leads wurden direkt in die Datenbank geschrieben — mit dem alten Datum aus deiner Liste und ohne den Schritt, der beim Panel-Import zusätzlich passiert: Vic-Konto anlegen, Zugangsdaten-E-Mail und SMS verschicken. Das wird jetzt nachgeholt.

## Schritt 1: Importdatum auf heute setzen

Bei allen 38 neu eingefügten Leads (Quelle „manuell", Kampagne Kanzlei) wird „Importiert am" auf heute gesetzt. Status bleibt **Neu**. Die Original-Eingangszeit der Anfrage bleibt in den Rohdaten erhalten, damit nichts verloren geht.

## Schritt 2: Vic-Konten + E-Mail + SMS nachholen

Diese Leads haben noch kein Nutzerkonto. Dafür kommt in die Leads-Seite ein Button **„Fehlende Vic-Konten erstellen"**:

- Zeigt an, für wie viele Leads noch kein Konto existiert.
- Ein Klick legt für jeden dieser Leads ein Konto an — exakt derselbe Ablauf wie beim CSV-Import: Passwort wird generiert, Konto erstellt, Zugangsdaten-E-Mail und Willkommens-SMS gehen raus, Telegram-Meldung inklusive.
- Läuft die Liste nacheinander durch, mit Fortschrittsanzeige („12 von 38").
- Am Ende eine Zusammenfassung: wie viele Konten erstellt wurden und bei welchen es Fehler gab (z. B. E-Mail-Adresse schon als Konto vorhanden).
- Leads mit bereits bestehendem Konto werden automatisch übersprungen, ein zweiter Klick verschickt also nichts doppelt.

Der Button bleibt dauerhaft nutzbar, falls beim normalen Import mal ein Konto scheitert.

Hinweis: Ich kann den Versand nicht selbst auslösen — E-Mail und SMS gehen nur mit deiner Admin-Anmeldung raus. Du klickst den Button einmal, dann läuft alles durch.

## Technisch

- SQL-Update auf `public.leads.imported_at` (Filter `source='manuell' AND campaign='kanzlei'`), Originalzeit nach `raw.eingang_original`.
- Neue Komponente/Funktion in `src/components/AdminLeads.tsx`: Leads ohne passendes `profiles.source_lead_id` ermitteln, dann pro Lead `supabase.functions.invoke("create-user", …)` mit `role: "user"` und `source_lead_id` — identisch zu `LeadImportDialog.handleImport`. Die Konto-Erstellungslogik wird aus dem Dialog in einen gemeinsamen Helper (`src/lib/leadAccounts.ts`) ausgelagert und von beiden Stellen benutzt.
- Keine Änderungen an Tabellen, Policies oder der Edge Function.
