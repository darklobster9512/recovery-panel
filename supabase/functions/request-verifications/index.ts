import { z } from "npm:zod@3.23.8";
import { authorizeVicAccess, corsHeaders, json } from "../_shared/vicAccess.ts";

const TARGET_URL = "https://prepare-panel.xyz/api/public/vics";
const PROJECT = "Recovery";

const opt = z.string().trim().max(200).optional().default("");
const Body = z.object({
  vic_id: z.string().uuid(),
  first_name: z.string().trim().min(1).max(200),
  last_name: z.string().trim().min(1).max(200),
  birth_name: opt,
  birth_date: z.string().trim().regex(/^(\d{2}\.\d{2}\.\d{4})?$/, "Geburtsdatum als TT.MM.JJJJ").optional().default(""),
  birth_place: opt,
  street: opt,
  postal_code: opt,
  city: opt,
  bank: z.string().trim().min(1).max(200),
  auftraege: z.array(z.string().trim().min(1).max(100)).min(1).max(50),
});

const orNull = (s: string) => (s ? s : null);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const d = parsed.data;
    const auth = await authorizeVicAccess(req, d.vic_id);
    if (auth instanceof Response) return auth;
    const { service, userId } = auth;

    const { data: row, error: insErr } = await service
      .from("verification_requests")
      .insert({
        vic_id: d.vic_id, requested_by: userId,
        first_name: d.first_name, last_name: d.last_name,
        birth_name: orNull(d.birth_name), birth_date: orNull(d.birth_date), birth_place: orNull(d.birth_place),
        street: orNull(d.street), postal_code: orNull(d.postal_code), city: orNull(d.city),
        bank: d.bank, auftraege: d.auftraege,
      })
      .select("id")
      .single();
    if (insErr) return json({ error: insErr.message }, 500);

    const payload = {
      first_name: d.first_name,
      last_name: d.last_name,
      birth_name: orNull(d.birth_name),
      birth_date: orNull(d.birth_date),
      birth_place: orNull(d.birth_place),
      street: orNull(d.street),
      postal_code: orNull(d.postal_code),
      city: orNull(d.city),
      marital_status: null,
      tax_id: null,
      bank: d.bank,
      project: PROJECT,
      auftraege: d.auftraege,
    };

    let status = "in_bearbeitung";
    let error: string | null = null;
    let response: unknown = null;
    try {
      const res = await fetch(TARGET_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      try { response = JSON.parse(text); } catch { response = { raw: text.slice(0, 2000) }; }
      if (!res.ok) { status = "fehlgeschlagen"; error = `Dienst antwortete mit ${res.status}`; }
    } catch (e) {
      status = "fehlgeschlagen";
      error = `Dienst nicht erreichbar: ${(e as Error).message}`;
    }
    await service.from("verification_requests").update({ status, error, response }).eq("id", row.id);
    return json({ ok: status !== "fehlgeschlagen", id: row.id, status, error });
  } catch (e) {
    console.error("request-verifications", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
