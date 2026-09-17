import { supabase } from "@/integrations/supabase/client";

export interface LeadForAccount {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
}

export interface AccountCreationResult {
  created: number;
  failed: string[];
}

const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateTempPassword(): string {
  const buf = new Uint32Array(8);
  crypto.getRandomValues(buf);
  let out = "";
  for (let i = 0; i < 8; i++) out += CHARS[buf[i] % CHARS.length];
  return out;
}

export function splitName(fullName: string | null): { firstName: string; lastName: string } {
  const name = (fullName || "").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  const firstName = parts.slice(0, -1).join(" ") || name || "Vic";
  const lastName = parts.length > 1 ? parts[parts.length - 1] : "";
  return { firstName, lastName };
}

/**
 * Creates a Vic account for each lead (same flow as the CSV import):
 * account + credentials email + welcome SMS + Telegram notification.
 */
export async function createVicAccountsForLeads(
  leads: LeadForAccount[],
  onProgress?: (done: number, total: number) => void,
): Promise<AccountCreationResult> {
  let created = 0;
  const failed: string[] = [];

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    if (!lead.email) {
      failed.push(`${lead.full_name ?? "?"} (keine E-Mail)`);
      onProgress?.(i + 1, leads.length);
      continue;
    }
    const { firstName, lastName } = splitName(lead.full_name);
    try {
      const res = await supabase.functions.invoke("create-user", {
        body: {
          email: lead.email,
          first_name: firstName,
          last_name: lastName || "—",
          phone: lead.phone_number || null,
          password: generateTempPassword(),
          source_lead_id: lead.id,
          role: "user",
        },
      });
      const payload = res.data as { error?: string } | null;
      if (res.error || payload?.error) {
        failed.push(`${lead.email} (${res.error?.message ?? payload?.error})`);
      } else {
        created++;
      }
    } catch (e) {
      failed.push(`${lead.email} (${e instanceof Error ? e.message : String(e)})`);
    }
    onProgress?.(i + 1, leads.length);
  }

  return { created, failed };
}

/** Leads that have no linked profile yet. */
export async function findLeadsWithoutAccount(): Promise<LeadForAccount[]> {
  const [{ data: leads, error: leadErr }, { data: profiles, error: profErr }] = await Promise.all([
    supabase.from("leads").select("id, full_name, email, phone_number").order("imported_at", { ascending: true }),
    supabase.from("profiles").select("source_lead_id").not("source_lead_id", "is", null),
  ]);
  if (leadErr) throw leadErr;
  if (profErr) throw profErr;

  const linked = new Set((profiles ?? []).map((p) => p.source_lead_id as string));
  return (leads ?? []).filter((l) => !linked.has(l.id)) as LeadForAccount[];
}
