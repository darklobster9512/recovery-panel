

# User Dashboard Redesign — Modernes, gamifiziertes Interface

## Konzept
Kompletter Umbau von `/dashboard`: Sidebar entfernen, stattdessen ein zentriertes, modernes Interface mit zwei Zuständen:

1. **Auftragsübersicht**: Zentrierte Hauptkarte mit Header (Begrüssung, Abmelden-Button), darunter die zugewiesenen Aufträge als einzelne Cards mit Status-Badge, Progress-Indikator und Auftragstitel
2. **Auftragsdetail**: Beim Klick auf einen Auftrag wechselt die Ansicht (animated transition) zur Detailansicht mit Zugangsdaten, Instruktionen und Status-Fortschritt

## Datenquelle
- `verification_assignments` WHERE `user_id = auth.uid()` — liefert zugewiesene Aufträge mit Status
- Separate Query für `verifications` (Titel, Logo, Instruktionen, required_fields)
- `field_values` aus der Assignment-Row enthält die zugewiesenen Zugangsdaten
- Phone-Nummer via `phone_number_id` -> `phone_numbers` -> anosim-proxy Edge Function

## UI-Design (im bestehenden hellen Kanzlei-Stil)
- **Kein Sidebar** — fullscreen zentriert, max-w-2xl
- **Header**: Minimal — Logo/Titel links, Abmelden rechts
- **Auftrags-Cards**: Weisse Karte mit feinem Border, Status-Badge (bestehende `AssignmentStatusBadge`), Progress-Bar (basierend auf Status: zugewiesen=33%, in_bearbeitung=66%, abgeschlossen=100%), Verifikations-Logo falls vorhanden
- **Gamification-Elemente** (seriös): Numerischer Fortschrittsbalken pro Auftrag, Gesamtfortschritt oben ("2 von 5 abgeschlossen"), subtile Animationen bei Hover/Transition
- **Detail-View**: Smooth Transition (CSS), zeigt Instruktionen als nummerierte Schritte, Zugangsdaten als Copy-fähige Felder, Zurück-Button

## Änderungen

### 1. `src/pages/Dashboard.tsx` — Komplett neu schreiben
- State: `selectedAssignment: string | null`
- Daten laden: Assignments + Verifications + Phone-Nummern für den aktuellen User
- Zwei Ansichten: Liste vs. Detail, gesteuert durch State
- Animierte Übergänge via CSS transitions
- Bestehende Komponenten nutzen: `AssignmentStatusBadge`, `Progress`, `Button`, `Card`
- Zugangsdaten (field_values) als Feld-Liste mit Copy-Button

### 2. Keine DB-Änderungen nötig
RLS auf `verification_assignments` erlaubt nur Admin-Zugriff. Der User braucht eine SELECT-Policy.

### 3. Migration: RLS-Policy für User-Zugriff
```sql
CREATE POLICY "Users can read own assignments"
ON public.verification_assignments
FOR SELECT TO authenticated
USING (user_id = auth.uid());
```
Ebenso braucht der User SELECT auf `verifications`:
```sql
CREATE POLICY "Users can read assigned verifications"
ON public.verifications
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.verification_assignments
    WHERE verification_id = verifications.id
    AND user_id = auth.uid()
  )
);
```

