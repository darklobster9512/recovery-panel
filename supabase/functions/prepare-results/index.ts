// Public endpoint for the external prepare-panel to deliver finished Aufträge.
// No API key (user decision): only accepts results for a known request_id and
// Aufträge that were requested there and not yet started. Returns no Vic data.
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { sendTelegramNotification } from "../_shared/telegram.ts";
import { identcodeFromLink, normKey } from "../_shared/auftrag.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const s = z.string().trim().max(2000).optional();
const Result = z.object({
  auftrag: z.string().trim().min(1).max(100),
  success: z.boolean(),
  email: s, identlink: s, anosim_link: s, username: s, password: s,
  pdf_base64: z.string().max(15_000_000).optional(),
  pdf_name: z.string().trim().max(200).optional(),
});
const Body = z.object({ request_id: z.string().uuid(), results: z.array(Result).min(1).max(50) });

function b64ToBytes(b64: string) {
  const clean = b64.replace(/^data:[^,]+,/, "").replace(/\s/g, "");
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
  const { request_id, results } = parsed.data;

  const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: items } = await service.from("verification_request_items")
    .select("id, vic_id, auftrag_key, status, verification_id").eq("request_id", request_id);
  if (!items?.length) return json({ error: "Unbekannte request_id" }, 404);

  const { data: verifs } = await service.from("verifications").select("id, type, title")
    .in("id", items.map((i: any) => i.verification_id).filter(Boolean));
  const typeOf = new Map((verifs ?? []).map((v: any) => [v.id, v.type]));
  const titleOf = new Map((verifs ?? []).map((v: any) => [v.id, v.title]));
  const succeeded: string[] = [];

  const out: { auftrag: string; ok: boolean; error?: string }[] = [];
  for (const r of results) {
    const item = items.find((i: any) => normKey(i.auftrag_key) === normKey(r.auftrag));
    if (!item) { out.push({ auftrag: r.auftrag, ok: false, error: "Auftrag nicht angefragt" }); continue; }
    if (item.status === "gestartet") { out.push({ auftrag: r.auftrag, ok: false, error: "Bereits gestartet" }); continue; }

    if (!r.success) {
      await service.from("verification_request_items").update({ status: "fehlgeschlagen" }).eq("id", item.id);
      out.push({ auftrag: r.auftrag, ok: true });
      continue;
    }

    const isPostident = typeOf.get(item.verification_id) === "postident" || /postident$/i.test(item.auftrag_key);
    if (isPostident) {
      if (!r.pdf_base64) { out.push({ auftrag: r.auftrag, ok: false, error: "pdf_base64 fehlt" }); continue; }
      let bytes: Uint8Array;
      try { bytes = b64ToBytes(r.pdf_base64); } catch { out.push({ auftrag: r.auftrag, ok: false, error: "pdf_base64 ungültig" }); continue; }
      if (bytes.length > 20 * 1024 * 1024) { out.push({ auftrag: r.auftrag, ok: false, error: "PDF zu groß" }); continue; }
      const path = `${item.vic_id}/requests/${item.id}.pdf`;
      const { error: upErr } = await service.storage.from("user-documents")
        .upload(path, bytes, { contentType: "application/pdf", upsert: true });
      if (upErr) { out.push({ auftrag: r.auftrag, ok: false, error: "PDF-Speichern fehlgeschlagen" }); continue; }
      await service.from("verification_request_items").update({
        status: "bereit", pdf_path: path, pdf_name: r.pdf_name || "postident.pdf",
      }).eq("id", item.id);
      succeeded.push(titleOf.get(item.verification_id) || item.auftrag_key);
      out.push({ auftrag: r.auftrag, ok: true });
      continue;
    }

    const fv: Record<string, string> = {};
    if (r.email) fv.email = r.email;
    if (r.username) fv.username = r.username;
    if (r.password) fv.password = r.password;
    if (r.identlink) { fv.identlink = r.identlink; const c = identcodeFromLink(r.identlink); if (c) fv.identcode = c; }
    if (r.anosim_link && !/[?&]token=/.test(r.anosim_link)) {
      out.push({ auftrag: r.auftrag, ok: false, error: "anosim_link ohne token" }); continue;
    }
    await service.from("verification_request_items").update({
      status: "bereit", field_values: fv, anosim_link: r.anosim_link ?? null,
    }).eq("id", item.id);
    succeeded.push(titleOf.get(item.verification_id) || item.auftrag_key);
    out.push({ auftrag: r.auftrag, ok: true });
  }
  if (succeeded.length) {
    const notify = (async () => {
      const vicId = items[0].vic_id;
      const nm = (p: any) => p ? ([p.first_name, p.last_name].filter(Boolean).join(" ").trim() || p.email || null) : null;
      const { data: vic } = await service.from("profiles").select("first_name, last_name, email, assigned_caller_id").eq("id", vicId).maybeSingle();
      let callerName: string | null = null;
      if (vic?.assigned_caller_id) {
        const { data: c } = await service.from("profiles").select("first_name, last_name, email").eq("id", vic.assigned_caller_id).maybeSingle();
        callerName = nm(c);
      }
      await sendTelegramNotification(service, "verifications_prepared", {
        vic_id: vicId, vic_name: nm(vic), caller_name: callerName, items: succeeded,
      });
    })().catch((e) => console.error("telegram notify failed", e));
    // @ts-ignore EdgeRuntime exists in Supabase
    if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(notify); else await notify;
  }
  return json({ ok: out.every((o) => o.ok), results: out });
});
