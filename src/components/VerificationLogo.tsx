import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "verification-logos";
const signedUrlCache = new Map<string, Promise<string | null>>();

function getStoragePath(value: string): string | null {
  if (!value) return null;
  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return value.replace(/^\/+/, "");
  }

  try {
    const url = new URL(value);
    if (url.pathname.includes(`/object/sign/${BUCKET}/`)) return null;
    const marker = `/object/public/${BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);
    return markerIndex === -1
      ? null
      : decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

export async function resolveVerificationLogo(value: string | null): Promise<string | null> {
  if (!value) return null;
  const path = getStoragePath(value);
  if (!path) return value;

  let pending = signedUrlCache.get(path);
  if (!pending) {
    pending = supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60)
      .then(({ data, error }) => (error ? null : data.signedUrl));
    signedUrlCache.set(path, pending);
  }
  return pending;
}

interface VerificationLogoProps {
  value: string | null;
  alt: string;
  className: string;
  fallback?: ReactNode;
}

export default function VerificationLogo({ value, alt, className, fallback = null }: VerificationLogoProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    setSrc(null);
    resolveVerificationLogo(value).then((url) => {
      if (active) setSrc(url);
    });
    return () => {
      active = false;
    };
  }, [value]);

  if (!src || failed) return <>{fallback}</>;
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}