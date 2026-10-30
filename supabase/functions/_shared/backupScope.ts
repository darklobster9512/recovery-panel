// Pure rules deciding which rows/files belong to one brand in a brand backup.
// Shared by the admin-backup edge function and the Vitest suite (no Deno APIs here).

/** Never exported: server-internal secrets. */
export const EXCLUDED_TABLES = new Set(["public.backup_secrets"]);

/** Global tables: copied into every brand backup, never brand-filtered. */
export const GLOBAL_TABLES = new Set([
  "public.app_settings",
  "public.verifications",
  "public.chat_templates",
  "public.sms_templates",
  "public.sms_templates_config",
  "public.telegram_chats",
  "public.telegram_notification_subscriptions",
  "public.contact_requests",
]);

/** Buckets whose files are global (not tied to a person). */
export const GLOBAL_BUCKETS = new Set(["verification-logos"]);

/** SQL set of person ids (Vics + callers) of the brand; brand id is $1. */
export const BRAND_PEOPLE = "(SELECT id FROM public.profiles WHERE branding_id = $1)";
const BRAND_LEADS = "(SELECT id FROM public.leads WHERE branding_id = $1)";
const BRAND_REQUESTS = `(SELECT id FROM public.verification_requests WHERE vic_id IN ${BRAND_PEOPLE})`;
const BRAND_TODOS = `(SELECT id FROM public.todos WHERE assigned_caller_id IN ${BRAND_PEOPLE})`;

const q = (c: string) => '"' + c.replace(/"/g, '""') + '"';

/**
 * WHERE clause (using $1 = brand id) for a table in a brand backup.
 * null = global table (all rows). "EXCLUDE" = table is skipped.
 */
export function brandWhere(key: string, cols: string[]): string | null | "EXCLUDE" {
  if (EXCLUDED_TABLES.has(key)) return "EXCLUDE";
  if (GLOBAL_TABLES.has(key)) return null;
  if (key === "public.brandings") return "id = $1";
  if (key === "public.profiles") return "branding_id = $1";
  if (key === "auth.users") return `id IN ${BRAND_PEOPLE}`;
  const has = (c: string) => cols.includes(c);
  if (has("branding_id")) return "branding_id = $1";
  if (has("vic_id")) return `${q("vic_id")} IN ${BRAND_PEOPLE}`;
  if (has("lead_id")) return `${q("lead_id")} IN ${BRAND_LEADS}`;
  if (has("request_id")) return `${q("request_id")} IN ${BRAND_REQUESTS}`;
  if (has("todo_id")) return `${q("todo_id")} IN ${BRAND_TODOS}`;
  for (const c of ["user_id", "caller_id", "assigned_caller_id", "created_by"]) {
    if (has(c)) return `${q(c)} IN ${BRAND_PEOPLE}`;
  }
  return null;
}

/** Whether a stored file belongs to the brand (first path segment is the person id). */
export function fileInBrand(bucket: string, path: string, people: Set<string>): boolean {
  if (GLOBAL_BUCKETS.has(bucket)) return true;
  return people.has(path.split("/")[0]);
}

/** Import order: auth users first, then brands, profiles, roles, leads, rest in given (FK) order. */
export function importOrder(keys: string[]): string[] {
  const head = ["auth.users", "auth.identities", "public.brandings", "public.profiles", "public.user_roles", "public.leads"];
  return [...head.filter((k) => keys.includes(k)), ...keys.filter((k) => !head.includes(k))];
}
