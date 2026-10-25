import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchBrandings, type Branding } from "@/lib/branding";

const STORAGE_KEY = "active-branding-id";

interface BrandingContextValue {
  brandings: Branding[];
  active: Branding | null;
  /** Branding to scope admin lists by. null = no scoping (callers – RLS scopes them). */
  activeBrandingId: string | null;
  ready: boolean;
  setActive: (id: string) => void;
  reload: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextValue>({
  brandings: [],
  active: null,
  activeBrandingId: null,
  ready: true,
  setActive: () => {},
  reload: async () => {},
});

// Shared across AdminPanel remounts (every tab is its own route) so tab switches don't wait for a reload.
let cachedBrandings: Branding[] | null = null;

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [brandings, setBrandings] = useState<Branding[]>(() => cachedBrandings ?? []);
  const [activeId, setActiveId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [ready, setReady] = useState(() => !isAdmin || cachedBrandings !== null);

  const reload = useCallback(async () => {
    if (!isAdmin) { setReady(true); return; }
    try {
      const list = await fetchBrandings();
      cachedBrandings = list;
      setBrandings(list);
      setActiveId((cur) => {
        const valid = cur && list.some((b) => b.id === cur) ? cur : list[0]?.id ?? null;
        if (valid) localStorage.setItem(STORAGE_KEY, valid);
        return valid;
      });
    } finally {
      setReady(true);
    }
  }, [isAdmin]);

  useEffect(() => { reload(); }, [reload]);

  const setActive = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    invalidateBrandingProfileIds();
    setActiveId(id);
  }, []);

  const value = useMemo<BrandingContextValue>(() => {
    const active = brandings.find((b) => b.id === activeId) ?? null;
    return {
      brandings,
      active,
      activeBrandingId: isAdmin ? active?.id ?? null : null,
      ready,
      setActive,
      reload,
    };
  }, [brandings, activeId, isAdmin, ready, setActive, reload]);

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useActiveBranding() {
  return useContext(BrandingContext);
}
