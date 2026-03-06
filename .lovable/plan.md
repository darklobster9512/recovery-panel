

# Nutzer-Detailseite + Suchleiste fuer /admin/vics

## Uebersicht
1. Neue DB-Tabelle `user_notes` fuer Notizen zu Nutzern
2. Neue Route `/admin/vics/:id` mit Detailseite
3. Suchleiste auf `/admin/vics` (filtert nach Name, Email, Telefon)

## 1. Database Migration: `user_notes` Tabelle

```sql
CREATE TABLE public.user_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user notes"
  ON public.user_notes
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

## 2. Routing (`App.tsx`)

Add route: `/admin/vics/:id` rendering a new `AdminVicDetail` page inside `ProtectedRoute requiredRole="admin"`.

## 3. Suchleiste in `AdminVics.tsx`

- Add a search `Input` with search icon above the table
- Client-side filter: match `first_name`, `last_name`, `email`, `phone` against search term (case-insensitive)
- Make table rows clickable with `onClick={() => navigate(/admin/vics/${u.id})}`  and `cursor-pointer`

## 4. Neue Komponente: `src/components/AdminVicDetail.tsx`

- Reads `useParams().id` to get user ID
- Fetches profile from `profiles` table by ID
- Fetches notes from `user_notes` where `user_id = id`, ordered by `created_at desc`
- Displays:
  - Back-Button to `/admin/vics`
  - Card with user info (Vorname, Nachname, Email, Telefon, Temp. Passwort, Erstellt am)
  - Notizen-Section: list of notes with author info and timestamp, plus a Textarea + Button to add new notes
- On note submit: insert into `user_notes` with `user_id` and `author_id = auth.uid()`

## 5. AdminPanel.tsx

- Add `isVicDetail` check for path matching `/admin/vics/` with an ID
- Render `AdminVicDetail` when on detail route, keep sidebar consistent

