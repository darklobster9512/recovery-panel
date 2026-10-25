import { supabase } from "@/integrations/supabase/client";

export interface Branding {
  id: string;
  company_name: string;
  tagline: string;
  logo_url: string | null;
  favicon_url: string | null;
  brand_color: string;
  street: string;
  city: string;
  phone: string;
  email: string;
  lawyer: string;
  vat_id: string;
  website: string;
  domain: string;
  additional_domains: string[];
  panel_subprefix: string;
  resend_api_key: string;
  resend_from_name: string;
  resend_from_email: string;
  sevenio_api_key: string;
  sevenio_from_name: string;
  created_at: string;
}

export type PublicBranding = Pick<
  Branding,
  "id" | "company_name" | "tagline" | "logo_url" | "favicon_url" | "brand_color" | "street" | "city" | "phone" | "email" | "lawyer" | "vat_id" | "website" | "domain"
>;

export const EMPTY_BRANDING: Omit<Branding, "id" | "created_at"> = {
  company_name: "",
  tagline: "",
  logo_url: null,
  favicon_url: null,
  brand_color: "#0061FF",
  street: "",
  city: "",
  phone: "",
  email: "",
  lawyer: "",
  vat_id: "",
  website: "",
  domain: "",
  additional_domains: [],
  panel_subprefix: "portal",
  resend_api_key: "",
  resend_from_name: "",
  resend_from_email: "",
  sevenio_api_key: "",
  sevenio_from_name: "",
};

export async function fetchBrandings(): Promise<Branding[]> {
  const { data, error } = await (supabase as any).from("brandings").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []) as Branding[];
}

export async function fetchBrandingForHost(host: string): Promise<PublicBranding | null> {
  const { data, error } = await (supabase as any).rpc("get_branding_for_host", { _host: host });
  if (error) return null;
  return ((data ?? [])[0] as PublicBranding) ?? null;
}

const PROFILE_IDS_TTL = 60_000;
const profileIdsCache = new Map<string, { at: number; promise: Promise<string[]> }>();

export function invalidateBrandingProfileIds() {
  profileIdsCache.clear();
}

/** Fetch ids of Vic profiles belonging to a branding (used to scope dependent tables). Cached briefly and shared across tabs. */
export function fetchBrandingProfileIds(brandingId: string): Promise<string[]> {
  const hit = profileIdsCache.get(brandingId);
  if (hit && Date.now() - hit.at < PROFILE_IDS_TTL) return hit.promise;
  const promise = loadBrandingProfileIds(brandingId);
  profileIdsCache.set(brandingId, { at: Date.now(), promise });
  promise.catch(() => profileIdsCache.delete(brandingId));
  return promise;
}

async function loadBrandingProfileIds(brandingId: string): Promise<string[]> {
  const ids: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("id")
      .eq("branding_id", brandingId)
      .range(from, from + 999);
    if (error) throw error;
    ids.push(...(data ?? []).map((r: { id: string }) => r.id));
    if (!data || data.length < 1000) break;
  }
  return ids;
}

/** Read an image file as a data URL (logos are stored inline so the login page can show them without auth). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
