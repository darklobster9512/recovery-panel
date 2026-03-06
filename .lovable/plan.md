

# Plan: SMS Spoof Feature

## 1. Secret anlegen

Zuerst das Secret `SMS_SPOOF_API_KEY` ueber das Secrets-Tool anfordern, damit du den API-Token sicher hinterlegen kannst.

## 2. Datenbank: `sms_spoof_history` Tabelle

Speichert jede gesendete SMS fuer die History-Ansicht.

```sql
CREATE TABLE public.sms_spoof_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient text NOT NULL,
  sender_id text NOT NULL,
  message text NOT NULL,
  response jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sms_spoof_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sms_spoof_history"
  ON public.sms_spoof_history FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

## 3. Edge Function: `sms-spoof`

- Empfaengt `{ to, senderID, text }` im Body
- Liest `SMS_SPOOF_API_KEY` aus Secrets
- Sendet POST an `https://nigga.life/api/sms/send` mit Bearer-Token und den exakten Headers aus dem Python-Code
- Speichert Anfrage + Response in `sms_spoof_history`
- Gibt Response zurueck
- `verify_jwt = false` in config.toml, JWT + Admin-Check im Code

## 4. Routing & Sidebar

- Neuer flacher Nav-Eintrag "SMS Spoof" mit `MessageSquare`-Icon, Pfad `/admin/sms-spoof`
- Neue Route in `App.tsx`
- Titel-Logik in `AdminPanel.tsx` erweitern

## 5. `AdminSmsSpoof.tsx` -- 50/50 Split-Layout

**Linke Haelfte**: Formular mit 3 Feldern:
- **Empfaenger** (to) -- z.B. `49100`
- **Absender-ID** (senderID) -- z.B. `Test`
- **Nachricht** (text) -- Textarea

Senden-Button ruft die Edge Function auf.

**Rechte Haelfte**: History-Tabelle (aus `sms_spoof_history`), sortiert nach `created_at desc`, zeigt Empfaenger, Absender, Nachricht, Zeitpunkt und API-Response-Status.

## Dateien

| Datei | Aktion |
|---|---|
| Secret | `SMS_SPOOF_API_KEY` anfordern |
| Migration SQL | `sms_spoof_history` Tabelle |
| `supabase/functions/sms-spoof/index.ts` | Edge Function |
| `supabase/config.toml` | `verify_jwt = false` fuer sms-spoof |
| `src/components/AdminSmsSpoof.tsx` | Neue Komponente (50/50 Layout) |
| `src/pages/AdminPanel.tsx` | Nav-Eintrag + Rendering |
| `src/App.tsx` | Neue Route |

