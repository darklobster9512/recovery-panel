# AGENTS.md

- Company data, domains, logos and Resend/seven.io credentials live per brand in `public.brandings`; `app_settings` only holds global settings (booking, backups) and is a fallback for empty brand fields. Why: multiple brands share one portal.
- `leads`, `profiles` (Vics and callers) and `phone_numbers` carry `branding_id`; other tables are scoped through the Vic's profile. Why: one source of truth per person.
- Admin lists filter by the active brand from `useActiveBranding()` (`src/contexts/BrandingContext.tsx`); dependent tables are filtered client-side via `fetchBrandingProfileIds`. Callers are not brand-switched (RLS scopes them). Why: brand switch must not require new RLS per table.
- The login page and other anonymous reads get brand data only through the `get_branding_for_host` RPC (public fields, no keys); `brandings` is admin-only via RLS. Why: credentials must never be exposed.
- Edge functions resolve brand settings via `supabase/functions/_shared/branding.ts` (`loadSettingsForUser`). Why: e-mail/SMS sender follows the Vic's brand.
- Brand logos are stored as data URLs in `brandings.logo_url` because public storage buckets are blocked in this workspace.
- Linked caller accounts (`caller_account_links`, one account per brand per group) switch sessions only through the `caller-switch` edge function, which checks the group server-side. Why: passwordless login must never be client-decided.
