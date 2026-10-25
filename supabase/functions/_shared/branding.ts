// Branding-aware settings: global app_settings merged with the branding of a user.
// Non-empty branding values override global values.

const OVERRIDE_KEYS = [
  "company_name", "tagline", "street", "city", "phone", "email", "lawyer", "vat_id", "website", "panel_subprefix",
  "resend_api_key", "resend_from_name", "resend_from_email", "sevenio_api_key", "sevenio_from_name",
] as const;

export async function loadBrandingById(admin: any, brandingId: string | null | undefined) {
  if (!brandingId) return null;
  const { data } = await admin.from("brandings").select("*").eq("id", brandingId).maybeSingle();
  return data ?? null;
}

export async function loadBrandingIdForUser(admin: any, userId: string | null | undefined): Promise<string | null> {
  if (!userId) return null;
  const { data } = await admin.from("profiles").select("branding_id").eq("id", userId).maybeSingle();
  return (data?.branding_id as string | null) ?? null;
}

/** Returns app_settings merged with the branding (by id). */
export async function loadSettingsForBranding(admin: any, brandingId: string | null | undefined): Promise<Record<string, any> | null> {
  const [{ data: settings }, branding] = await Promise.all([
    admin.from("app_settings").select("*").eq("id", true).maybeSingle(),
    loadBrandingById(admin, brandingId),
  ]);
  if (!settings && !branding) return null;
  const merged: Record<string, any> = { ...(settings ?? {}) };
  if (branding) {
    for (const k of OVERRIDE_KEYS) {
      const v = branding[k];
      if (typeof v === "string" && v.trim() !== "") merged[k] = v;
    }
  }
  return merged;
}

/** Returns app_settings merged with the branding of the given user. */
export async function loadSettingsForUser(admin: any, userId: string | null | undefined) {
  return loadSettingsForBranding(admin, await loadBrandingIdForUser(admin, userId));
}
