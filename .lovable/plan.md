

# Plan: SMS Templates mit Vic-Versand

## 1. Datenbank

Neue Tabelle `sms_templates`:

```sql
CREATE TABLE public.sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id text NOT NULL,
  message text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sms_templates"
  ON public.sms_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

## 2. UI-Aenderungen in `AdminSmsSpoof.tsx`

### Neue Sektion unterhalb des bestehenden Layouts

- Titel "SMS Templates"
- Grid-Layout: max 5 Cards pro Zeile (`grid-cols-2 md:grid-cols-3 lg:grid-cols-5`)
- Erste Card: "+" Button zum Erstellen (Dialog mit Absender-ID + Nachricht Eingabe)
- Template Cards: Absender-ID als Titel, Nachricht als Preview (truncated), "Senden an" Button

### Template erstellen Dialog
- Input: Absender-ID
- Textarea: Nachricht
- Speichern in `sms_templates`

### "Senden an" Dialog (Vic-Auswahl)
- Suchleiste + ScrollArea mit Vic-Liste (max 10 sichtbar)
- Vics werden aus `user_roles` (role=user) + `profiles` geladen
- Beim Klick auf einen Vic:
  - Telefonnummer aus `profiles.phone` lesen
  - Format-Konvertierung: `0176...` wird zu `49176...` (fuehrende 0 durch 49 ersetzen)
  - SMS direkt via `supabase.functions.invoke("sms-spoof")` senden mit Template-Daten + konvertierter Nummer
  - Toast-Feedback

### Template loeschen
- Kleiner Delete-Button (X/Trash) auf der Card

## 3. Dateien

| Datei | Aktion |
|---|---|
| Migration SQL | `sms_templates` Tabelle + RLS |
| `src/components/AdminSmsSpoof.tsx` | Templates-Sektion, Create-Dialog, Vic-Auswahl-Dialog |
| `src/integrations/supabase/types.ts` | Wird automatisch aktualisiert |

