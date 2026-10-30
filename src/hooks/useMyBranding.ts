import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SETTINGS } from "@/lib/settings";

export interface MyBranding {
  company_name: string;
  tagline: string;
  logo_url: string | null;
  street: string;
  city: string;
  phone: string;
  email: string;
  lawyer: string;
  website: string;
}

export const FALLBACK_BRANDING: MyBranding = {
  company_name: DEFAULT_SETTINGS.company_name,
  tagline: "Rechtsanwaltskanzlei",
  logo_url: null,
  street: DEFAULT_SETTINGS.street,
  city: DEFAULT_SETTINGS.city,
  phone: DEFAULT_SETTINGS.phone,
  email: DEFAULT_SETTINGS.email,
  lawyer: DEFAULT_SETTINGS.lawyer,
  website: DEFAULT_SETTINGS.website,
};

/** True when the brand is the original Korte brand (photo/registry data only exist for it). */
export const isKorteBrand = (b: MyBranding) => /korte/i.test(b.lawyer) || /korte/i.test(b.company_name);

let cache: { uid: string; p: Promise<MyBranding> } | null = null;

function load(uid: string): Promise<MyBranding> {
  if (cache?.uid === uid) return cache.p;
  const p = (async () => {
    const { data } = await supabase.rpc("my_branding" as any);
    const row = (Array.isArray(data) ? data[0] : data) as Partial<MyBranding> | undefined;
    if (!row) return FALLBACK_BRANDING;
    const pick = (k: keyof MyBranding) => ((row[k] as string | null | undefined)?.toString().trim() || FALLBACK_BRANDING[k]) as string;
    return {
      company_name: pick("company_name"), tagline: pick("tagline"), logo_url: row.logo_url || null,
      street: pick("street"), city: pick("city"), phone: pick("phone"), email: pick("email"),
      lawyer: pick("lawyer"), website: pick("website"),
    };
  })().catch(() => FALLBACK_BRANDING);
  cache = { uid, p };
  return p;
}

/** Brand of the signed-in Vic; `null` while loading. */
export function useMyBranding(): MyBranding | null {
  const [b, setB] = useState<MyBranding | null>(null);
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id;
      if (!uid) { if (alive) setB(FALLBACK_BRANDING); return; }
      load(uid).then((r) => alive && setB(r));
    });
    return () => { alive = false; };
  }, []);
  return b;
}
