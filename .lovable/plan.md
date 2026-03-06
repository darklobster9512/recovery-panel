

# Fix: User Roles Not Loading (Infinite Spinner on /admin)

## Root Cause

The RLS policies on `user_roles` and `profiles` were created as **RESTRICTIVE** (`WITH CHECK` style) instead of **PERMISSIVE**. In Postgres RLS, restrictive policies only narrow results from permissive policies. With zero permissive policies, all queries return empty -- so the role fetch always fails silently, `role` stays `null`, and `ProtectedRoute` never resolves.

## Fix 1: Database Migration

Drop the restrictive policies and recreate them as permissive:

```sql
-- Fix user_roles policy
DROP POLICY "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Fix profiles policies
DROP POLICY "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());
```

## Fix 2: useAuth.ts -- Use `.maybeSingle()` instead of `.single()`

Change the `fetchRole` function to use `.maybeSingle()` so it returns `null` gracefully when no role is found instead of throwing an error.

## Files Changed
- **1 new migration** (SQL above)
- **`src/hooks/useAuth.ts`** (line ~27: `.single()` -> `.maybeSingle()`)

