import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sanitizeSender } from "../_shared/sevenio.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin-only: checks each brand's seven.io key (balance) without sending SMS.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: u } = await admin.auth.getUser(token);
  if (!u?.user) return json({ error: "unauthorized" }, 401);
  const { data: isAdmin } = await admin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
  if (!isAdmin) return json({ error: "forbidden" }, 403);

  const { data: brands } = await admin.from("brandings").select("id, company_name, sevenio_api_key, sevenio_from_name");
  const out = [];
  for (const b of brands ?? []) {
    const key = String(b.sevenio_api_key || "");
    let balance: string | null = null, error: string | null = null;
    if (!key) error = "kein Schlüssel";
    else {
      const r = await fetch("https://gateway.seven.io/api/balance", { headers: { "X-Api-Key": key, Accept: "application/json" } });
      const t = (await r.text()).trim();
      if (!r.ok || t === "900") error = `Schlüssel ungültig (${t || r.status})`;
      else balance = t;
    }
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    const { data: logs } = await admin.from("sms_dispatch_log").select("ok, error").eq("branding_id", b.id).gte("created_at", since);
    out.push({
      brand: b.company_name, key_tail: key ? key.slice(-4) : null, balance, error,
      sender_configured: b.sevenio_from_name, sender_used: sanitizeSender(b.sevenio_from_name),
      sent_7d: (logs ?? []).filter((l) => l.ok).length, failed_7d: (logs ?? []).filter((l) => !l.ok).length,
    });
  }
  return json({ brands: out });
});
