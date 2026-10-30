// Called by the call_logs AFTER INSERT trigger (pg_net) for incoming missed calls.
// Authenticated by the internal backup_secrets token; sends the "call_missed" Telegram notification.
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { sendTelegramNotification } from "../_shared/telegram.ts";
import { normalizePhone } from "../_shared/phone.ts";

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
const Body = z.object({ call_log_id: z.string().uuid(), token: z.string().min(10).max(200) });
const nm = (p: any) => p ? [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || p.email || null : null;

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: "invalid body" }, 400);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: ok } = await admin.rpc("backup_check_token", { _token: parsed.data.token });
  if (!ok) return json({ error: "unauthorized" }, 401);

  const { data: c } = await admin.from("call_logs").select("*").eq("id", parsed.data.call_log_id).maybeSingle();
  if (!c || c.status !== "missed" || c.direction !== "in") return json({ ok: true, ignored: true });

  // Find Vic by phone (only Vics, i.e. role "user").
  let vic: any = null;
  const target = normalizePhone(c.remote_number);
  if (target) {
    const tail = target.slice(-7);
    const { data: cands } = await admin.from("profiles")
      .select("id, first_name, last_name, email, phone, assigned_caller_id, branding_id")
      .ilike("phone", `%${tail.slice(-4)}%`).limit(200);
    vic = (cands ?? []).find((p: any) => normalizePhone(p.phone) === target) ?? null;
  }

  const callerId = c.caller_id ?? vic?.assigned_caller_id ?? null;
  let caller: any = null;
  if (callerId) {
    const { data } = await admin.from("profiles").select("first_name, last_name, email, branding_id").eq("id", callerId).maybeSingle();
    caller = data;
  }

  const time_label = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(c.started_at)).replace(", ", " um ") + " Uhr";

  const res = await sendTelegramNotification(admin, "call_missed", {
    remote_number: c.remote_number,
    vic_name: nm(vic) ?? c.remote_name ?? null,
    caller_name: c.caller_name || nm(caller),
    time_label,
    line_label: `Slot ${c.slot} · ${c.bot_number}`,
    branding_id: caller?.branding_id ?? vic?.branding_id ?? null,
  });
  return json({ ok: true, ...res });
});
