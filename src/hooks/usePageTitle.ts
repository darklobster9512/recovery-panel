import { useEffect, useState } from "react";
import { fetchBrandingForHost, type PublicBranding } from "@/lib/branding";

let hostBrandingPromise: Promise<PublicBranding | null> | null = null;

export function getHostBranding() {
  hostBrandingPromise ??= fetchBrandingForHost(window.location.hostname);
  return hostBrandingPromise;
}

/** Sets document.title to "<company> – <suffix>". companyName overrides the host branding (e.g. admin's active brand). */
export function usePageTitle(suffix: string, companyName?: string | null) {
  const [hostName, setHostName] = useState<string | null>(null);
  useEffect(() => {
    if (companyName) return;
    getHostBranding().then((b) => setHostName(b?.company_name ?? null));
  }, [companyName]);
  useEffect(() => {
    const name = companyName || hostName;
    document.title = name ? `${name} – ${suffix}` : suffix;
  }, [companyName, hostName, suffix]);
}
