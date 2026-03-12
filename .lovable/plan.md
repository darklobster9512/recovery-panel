

# Auftrags-Überprüfungs-Workflow

## Übersicht
Neuer Workflow: Nutzer bestätigt Auftrag → Status "in_ueberpruefung" → Admin genehmigt/lehnt ab → Status "genehmigt" oder "abgelehnt". Bei Ablehnung kann der Nutzer erneut bestätigen.

## 1. Datenbank-Migration

Neue Enum-Werte zum `assignment_status` hinzufügen:

```sql
ALTER TYPE public.assignment_status ADD VALUE 'in_ueberpruefung';
ALTER TYPE public.assignment_status ADD VALUE 'genehmigt';
ALTER TYPE public.assignment_status ADD VALUE 'abgelehnt';
```

RLS-Policy ergänzen, damit Nutzer ihren eigenen Auftragsstatus auf `in_ueberpruefung` setzen können:

```sql
CREATE POLICY "Users can submit for review"
ON public.verification_assignments
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND status = 'in_ueberpruefung');
```

## 2. `AssignmentStatusBadge.tsx` — Neue Status-Badges

Neue Einträge in `STATUS_CONFIG` und `ASSIGNMENT_STATUSES`:
- `in_ueberpruefung` → "In Überprüfung" (orange)
- `genehmigt` → "Genehmigt" (green)
- `abgelehnt` → "Abgelehnt" (red)

## 3. `Dashboard.tsx` — "Auftrag abschließen"-Button + Bestätigungs-Dialog

- Nach der Anleitung-Sektion: Button "Auftrag abschließen" (nur sichtbar wenn Status `zugewiesen` oder `abgelehnt`)
- AlertDialog mit Bestätigungstext
- Bei Bestätigung: `supabase.update({ status: "in_ueberpruefung" })`, lokalen State aktualisieren
- Bei Status `abgelehnt`: Info-Banner anzeigen, dass der Auftrag erneut durchgeführt werden muss
- Bei Status `in_ueberpruefung` / `genehmigt`: entsprechender Hinweis, kein Button

## 4. Admin: Neuer Reiter "In Überprüfung"

### `AdminPanel.tsx`
- Neuer Nav-Eintrag: "In Überprüfung" mit `ClipboardCheck` Icon, Pfad `/admin/ueberpruefung`
- Route-Matching und Rendering der neuen Komponente

### `App.tsx`
- Neue Route: `/admin/ueberpruefung`

### Neue Komponente `AdminReview.tsx`
- Lädt alle `verification_assignments` mit `status = 'in_ueberpruefung'`
- Tabelle mit: Nutzer, Auftrag, Datum, Status
- Pro Zeile: "Genehmigen" (grün) und "Ablehnen" (rot) Buttons
- Genehmigen → Status auf `genehmigt`
- Ablehnen → Status auf `abgelehnt` (Nutzer sieht Badge + kann erneut einreichen)

### Dateien
- DB-Migration (3 neue Enum-Werte + RLS-Policy)
- `src/components/AssignmentStatusBadge.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/AdminPanel.tsx`
- `src/App.tsx`
- `src/components/AdminReview.tsx` (neu)

