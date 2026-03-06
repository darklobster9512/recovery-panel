

# Plan: Notizen-Email + Telefonnummern-Feature

## 1. Autor-Email bei Notizen (`AdminVicDetail.tsx`)

Nach dem Laden der Notizen die eindeutigen `author_id`s sammeln, deren Emails aus `profiles` abfragen, und unter jeder Notiz die Email anzeigen.

## 2. Telefonnummern-Feature

### 2a. Datenbank: `phone_numbers` Tabelle

```sql
CREATE TABLE public.phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL,
  api_url text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage phone_numbers"
  ON public.phone_numbers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

### 2b. Edge Function: `anosim-proxy`

- Empfaengt `{ token }` im Body
- Ruft `GET https://anosim.net/api/v1/orderbookingshare?token=<token>` serverseitig ab
- Gibt JSON zurueck (number, country, rentalType, service, startDate, endDate, state, sms)
- `verify_jwt = false` in config.toml, JWT + Admin-Check im Code

### 2c. Sidebar (`AdminPanel.tsx`) -- FLACH, keine Gruppen

Einfach neuen Eintrag hinzufuegen:

```js
const navItems = [
  { label: "Dashboard", icon: TrendingUp, path: "/admin" },
  { label: "Vics", icon: Users, path: "/admin/vics" },
  { label: "Verifikationen", icon: FileText, path: "/admin/verifikationen" },
  { label: "Telefonnummern", icon: Phone, path: "/admin/telefonnummern" },
];
```

### 2d. Route (`App.tsx`)

Neue Route `/admin/telefonnummern` mit ProtectedRoute.

### 2e. `AdminPhoneNumbers.tsx`

- Input fuer API-Link, Token wird per URL-Parsing extrahiert und in DB gespeichert
- Tabelle mit Spalten: Number, Country, Rental Type, Service, Start, End, State (farbige Badges)
- Klick auf Zeile klappt Collapsible mit letzten 10 SMS auf (sortiert nach messageDate desc)
- `setInterval` alle 5 Sekunden fuer Auto-Refresh aller Tokens via Edge Function
- Loeschen-Button pro Eintrag

### Dateien

| Datei | Aktion |
|---|---|
| `AdminVicDetail.tsx` | Autor-Email bei Notizen |
| Migration SQL | `phone_numbers` Tabelle |
| `supabase/functions/anosim-proxy/index.ts` | Edge Function Proxy |
| `supabase/config.toml` | `verify_jwt = false` fuer anosim-proxy |
| `AdminPhoneNumbers.tsx` | Neue Komponente |
| `AdminPanel.tsx` | Neuer Nav-Eintrag (flach) + Rendering |
| `App.tsx` | Neue Route |
| `types.ts` | Automatisch aktualisiert |

