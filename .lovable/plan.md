

# Admin "Vics" Tab with User Management

## Overview
Replace the "Nutzer" sidebar item with "Vics", add sub-routing under `/admin/vics`, and build a user table + creation form. An edge function will handle user creation server-side using the service role key so the admin session is preserved.

## Database Changes (Migration)

Add columns to `profiles` table:
```sql
ALTER TABLE public.profiles
  ADD COLUMN first_name text,
  ADD COLUMN last_name text,
  ADD COLUMN phone text,
  ADD COLUMN temp_password text;
```

The `temp_password` column stores the generated 6-char alphanumeric password so it can be displayed in the table.

## Edge Function: `create-user`

A new Deno edge function at `supabase/functions/create-user/index.ts` that:
1. Verifies the calling user is an admin (using `has_role`)
2. Generates a random 6-char alphanumeric password
3. Uses the Supabase Admin API (`supabase.auth.admin.createUser`) to create the user with email + password — this does NOT affect the admin's session
4. Updates the `profiles` row (created by trigger) with first_name, last_name, phone, temp_password
5. Returns the created user info including the temp password

## Routing Changes (`App.tsx`)

Add routes:
- `/admin` → AdminPanel (dashboard view, as now)
- `/admin/vics` → AdminPanel (vics view)

Use `/admin/*` with nested routes or a simple path check. The AdminPanel will use `useLocation` to determine which content to show.

## AdminPanel Changes

**Sidebar**: Replace "Nutzer" with "Vics", make sidebar items clickable with `navigate()`. Highlight active item based on current path.

**Main content area**: Conditionally render based on route:
- `/admin` → Dashboard stats (existing)
- `/admin/vics` → New `AdminVics` component

## New Component: `src/components/AdminVics.tsx`

**Table** displaying all users with role `user`:
- Query joins `profiles` + `user_roles` where role = 'user'
- Columns: Vorname, Nachname, Email, Telefon, Temp. Passwort, Erstellt am

**"Nutzer erstellen" Button** opens a Dialog:
- Form fields: Vorname, Nachname, Email, Telefonnummer
- On submit: calls the `create-user` edge function
- On success: refetch table, show toast with the generated password

**Password generation** (in edge function): 6 chars from `abcdefghijklmnopqrstuvwxyz0123456789`.

## Technical Details

- Edge function uses `SUPABASE_SERVICE_ROLE_KEY` (already available as secret)
- The admin's auth token is passed to the edge function for authorization check
- `profiles` trigger already auto-creates a profile row on signup, so the edge function just updates it with the extra fields
- RLS: admin can already read all profiles via existing policy

