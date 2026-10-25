import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { authorizeVicAccess, corsHeaders, json } from "../_shared/vicAccess.ts";
import { sendTelegramNotification } from "../_shared/telegram.ts";

const Body = z.object({ item_id: z.string().uuid() });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "item_id fehlt" }, 400);
    const pre = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: item } = await pre.from("verification_request_items").select("*").eq("id", parsed.data.item_id).maybeSingle();
    if (!item) return json({ error: "Auftrag nicht gefunden" }, 404);

    const auth = await authorizeVicAccess(req, item.vic_id);
    if (auth instanceof Response) return auth;
    const { service, userId } = auth;

    if (item.status !== "bereit") return json({ error: "Auftrag ist nicht bereit" }, 409);
    if (!item.verification_id) return json({ error: "Kein passender Auftrag im Panel" }, 409);

    // Lock against double starts
    const { data: locked } = await service.from("verification_request_items")
      .update({ status: "gestartet" }).eq("id", item.id).eq("status", "bereit").select("id");
    if (!locked?.length) return json({ error: "Bereits gestartet" }, 409);
    const unlock = () => service.from("verification_request_items").update({ status: "bereit" }).eq("id", item.id);

    const [{ data: verif }, { data: vic }] = await Promise.all([
      service.from("verifications").select("id, title, type, required_fields").eq("id", item.verification_id).maybeSingle(),
      service.from("profiles").select("id, first_name, last_name, email, branding_id").eq("id", item.vic_id).maybeSingle(),
    ]);
    if (!verif || !vic) { await unlock(); return json({ error: "Daten fehlen" }, 404); }
    const isPostident = verif.type === "postident";

    let phoneId: string | null = null;
    if (!isPostident && item.anosim_link) {
      let token: string | null = null;
      try { token = new URL(item.anosim_link).searchParams.get("token"); } catch { /* */ }
      if (!token) { await unlock(); return json({ error: "Ungültiger Anosim-Link" }, 400); }
      const { data: existing } = await service.from("phone_numbers").select("id").eq("token", token).maybeSingle();
      if (existing) phoneId = existing.id;
      else {
        const { data: ph, error: phErr } = await service.from("phone_numbers")
          .insert({ token, api_url: item.anosim_link, created_by: userId, branding_id: vic.branding_id }).select("id").single();
        if (phErr) { await unlock(); return json({ error: phErr.message }, 500); }
        phoneId = ph.id;
      }
    }

    const { data: assignment, error: aErr } = await service.from("verification_assignments").insert({
      verification_id: verif.id, user_id: vic.id,
      field_values: isPostident ? {} : item.field_values ?? {},
      phone_number_id: phoneId, created_by: userId,
    }).select("id").single();
    if (aErr || !assignment) { await unlock(); return json({ error: aErr?.message ?? "Zuweisen fehlgeschlagen" }, 500); }

    if (isPostident && item.pdf_path) {
      const { data: obj } = await service.storage.from("user-documents").download(item.pdf_path);
      await service.from("user_documents").insert({
        user_id: vic.id, assignment_id: assignment.id, file_name: item.pdf_name ?? "postident.pdf",
        file_path: item.pdf_path, file_type: "application/pdf", file_size: obj?.size ?? 0,
      });
    }
    await service.from("verification_request_items").update({ assignment_id: assignment.id }).eq("id", item.id);

    const vicName = `${vic.first_name ?? ""} ${vic.last_name ?? ""}`.trim() || (vic.email ?? "Unbekannt");
    await Promise.allSettled([
      sendTelegramNotification(service, "assignment_created", {
        vic_id: vic.id, vic_name: vicName, vic_email: vic.email,
        verification_title: verif.title, verification_type: isPostident ? "Postident" : "Videocall",
      }),
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-assignment-sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
        body: JSON.stringify({ assignment_id: assignment.id }),
      }),
    ]);
    return json({ ok: true, assignment_id: assignment.id });
  } catch (e) {
    console.error("start-prepared-item", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
