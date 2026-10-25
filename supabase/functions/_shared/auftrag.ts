// Mirrors src/lib/verificationRequests.ts (auftragKey) – keep in sync.
export function auftragKey(v: { title: string; type: string }): string {
  const parts = v.title.split(/\s+[—–-]\s+/);
  const bank = parts[0].trim();
  const sub = parts.slice(1).join(" ").trim();
  const kind = sub ? sub.toLowerCase().replace(/[\s-]+/g, "") : v.type === "postident" ? "postident" : "videoident";
  return `${bank.replace(/\s+/g, "")}-${kind}`;
}

export const normKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Last 9-digit number in the ident link. */
export function identcodeFromLink(link: string): string {
  const m = (link ?? "").match(/\d{9}(?!.*\d{9})/);
  return m ? m[0] : "";
}

export async function verificationKeyMap(service: any): Promise<Map<string, { id: string; type: string; title: string }>> {
  const { data } = await service.from("verifications").select("id, title, type");
  const map = new Map();
  for (const v of data ?? []) map.set(normKey(auftragKey(v)), v);
  return map;
}
