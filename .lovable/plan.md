

# Auth, Roles & Dashboard Implementation

## Overview
Build a split-screen auth page (light theme, Dropbox-style), user roles (admin/user), and two placeholder dashboards.

## Database Changes (Supabase Migration)

1. **Create `app_role` enum**: `admin`, `user`
2. **Create `user_roles` table**: `id`, `user_id` (FK to auth.users), `role` (app_role), unique constraint on (user_id, role)
3. **Create `profiles` table**: `id` (FK to auth.users), `email`, `created_at`
4. **Enable RLS** on both tables
5. **Security definer function** `has_role(uuid, app_role)` for role checks without recursion
6. **RLS policies**:
   - profiles: users can read/update own profile, admins can read all
   - user_roles: users can read own roles, admins can read all
7. **Trigger** on auth.users insert to auto-create profile + assign default `user` role

## New Files

### `src/pages/Auth.tsx`
- Light theme wrapper (white background, override dark theme)
- 50/50 split layout
- **Left side**: Login/Register toggle form with email + password, clean Dropbox-style typography (blue #0061FF accent), minimal borders, rounded inputs
- **Right side**: Animated trust section — blue gradient background with floating shield/lock icons, subtle dot grid pattern, trust badges ("256-bit encryption", "GDPR compliant"), smooth CSS animations
- Uses Supabase `signInWithPassword` and `signUp`
- On login, checks user role and redirects to `/admin` or `/dashboard`

### `src/pages/Dashboard.tsx`
- User dashboard placeholder with sidebar nav, welcome card, placeholder stats
- Protected route (redirects to /auth if not logged in)
- Light theme, clean modern style

### `src/pages/AdminPanel.tsx`
- Admin dashboard placeholder with sidebar nav, admin-specific cards
- Protected route (checks admin role, redirects if not admin)
- Light theme, clean modern style

### `src/hooks/useAuth.ts`
- Auth state management hook using `onAuthStateChange` + `getSession`
- Role fetching from `user_roles` table

### `src/components/ProtectedRoute.tsx`
- Wrapper component that checks auth state and role
- Redirects unauthenticated users to `/auth`
- Redirects non-admin users away from `/admin`

## Route Updates (`App.tsx`)
- Add `/auth` → Auth page
- Add `/dashboard` → ProtectedRoute(user) → Dashboard
- Add `/admin` → ProtectedRoute(admin) → AdminPanel

## Design Details

**Auth page (light theme)**:
- Font: Inter/system sans-serif feel
- Primary blue: `#0061FF` (Dropbox blue)
- Left: white bg, centered form card, "Welcome back" / "Create account" heading, email/password fields, submit button, toggle link
- Right: blue gradient (`#0061FF` to `#0040CC`), floating animated elements (lock icon, shield, checkmark), trust text ("Trusted by 10,000+ users"), subtle particle/dot animation

**Dashboards**: Clean white bg, sidebar with nav items, top bar with user info, placeholder metric cards

