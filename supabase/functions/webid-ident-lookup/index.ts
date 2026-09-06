// Public edge function used by the WebID reverse-proxy widget.
// Given the current WebID URL (containing /aid/<9-digit code>), returns the
// email, phone and latest TAN of the ACTIVE assignment that matches the code.
// - Only assignments with status in {zugewiesen, in_bearbeitung, in_ueberpruefung} count.
// - TAN is only considered if the SMS arrived AT OR AFTER the assignment's created_at,
//   so a TAN from a previous (completed) assignment on the same number is ignored.
// - Never stops "found": widget keeps polling and always shows the newest TAN.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const ACTIVE_STATUSES = ["zugewiesen", "in_bearbeitung", "in_ueberpruefung"];

// e.g. "WebID Identification TAN / Code: 227894"
const WEBID_TAN_REGEX = /WebID\s+Identification\s+TAN\s*\/\s*Code\s*:\s*(\d{4,8})/i;

function extractCode(url: string): string | null {
  try {
    const u = new URL(url);
    const m1 = u.pathname.match(/\/aid\/(\d{6,12})/i);
    if (m1) return m1[1].slice(-9);
    const m2 = url.match(/(\d{9})/);
    return m2 ? m2[1] : null;
  } catch {
    const m = url.match(/(\d{9})/);
    return m ? m[1] : null;
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchAnosimSms(token: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://anosim.net/api/v1/orderbookingshare?token=${encodeURIComponent(token)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.sms) ? data.sms : [];
  } catch {
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405);

  const url = new URL(req.url).searchParams.get("url") || "";
  const code = extractCode(url);
  if (!code) return json({ found: false, reason: "no_code" });

  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: rows, error } = await supa
    .from("verification_assignments")
    .select("id, user_id, status, phone_number_id, created_at, field_values, forwarded_sms")
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return json({ found: false, error: error.message });

  const assignment = (rows || []).find((r: any) => {
    const fv = r.field_values || {};
    const identcode = String(fv.identcode ?? "").trim();
    const identlink = String(fv.identlink ?? "").trim();
    return identcode === code || identlink.endsWith(code) || identlink.includes(code);
  });

  if (!assignment) return json({ found: false, reason: "no_active_assignment" });

  const fv = assignment.field_values || {};
  const email = fv.email ? String(fv.email) : null;
  const phone = fv.phone ? String(fv.phone) : null;
  const assignedAt = new Date(assignment.created_at);

  // 1) newest WebID-TAN from forwarded_sms within the assignment window
  let tan: string | null = null;
  let tanDate = 0;
  const forwarded: string[] = Array.isArray(assignment.forwarded_sms) ? assignment.forwarded_sms : [];
  for (const key of forwarded) {
    // stored as "sender|date"
    const idx = key.indexOf("|");
    if (idx < 0) continue;
    const date = key.slice(idx + 1);
    const ts = Date.parse(date);
    if (!isFinite(ts) || ts < assignedAt.getTime()) continue;
    // forwarded_sms only stores the composite key; we still need the text to
    // check the WebID prefix. Fall through to live fetch — the live path
    // covers both cases and is authoritative.
  }

  // 2) live fetch via Anosim, filter by assignment window + WebID regex, pick newest
  if (assignment.phone_number_id) {
    const { data: phoneRow } = await supa
      .from("phone_numbers")
      .select("token")
      .eq("id", assignment.phone_number_id)
      .maybeSingle();
    const token = phoneRow?.token as string | undefined;
    if (token) {
      const sms = await fetchAnosimSms(token);
      for (const m of sms) {
        const date = m?.messageDate;
        const text = String(m?.messageText ?? "");
        if (!date) continue;
        const ts = Date.parse(date);
        if (!isFinite(ts) || ts < assignedAt.getTime()) continue;
        const match = text.match(WEBID_TAN_REGEX);
        if (!match) continue;
        if (ts > tanDate) {
          tanDate = ts;
          tan = match[1];
        }
      }
    }
  }

  return json({ found: true, email, phone, tan });
});
