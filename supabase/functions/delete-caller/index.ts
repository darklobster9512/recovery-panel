import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: u } = await admin.auth.getUser(token);
    const me = u?.user?.id;
    if (!me) return json({ error: "Nicht angemeldet" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: me, _role: "admin" });
    if (!isAdmin) return json({ error: "Nur Admins dürfen Caller löschen" }, 403);

    const body = await req.json().catch(() => ({}));
    const id = typeof body?.caller_id === "string" ? body.caller_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Ungültige ID" }, 400);
    if (id === me) return json({ error: "Eigenes Konto kann nicht gelöscht werden" }, 400);

    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", id);
    const r = (roles ?? []).map((x: any) => x.role);
    if (!r.includes("caller") || r.includes("admin")) return json({ error: "Kein Caller-Konto" }, 400);

    const { data: prof } = await admin.from("profiles").select("avatar_url").eq("id", id).maybeSingle();

    // Keep shared data that would otherwise be cascaded away
    await admin.from("phone_numbers").update({ created_by: null }).eq("created_by", id);
    await admin.from("sms_spoof_history").update({ created_by: null }).eq("created_by", id);
    // Unassign
    await admin.from("profiles").update({ assigned_caller_id: null }).eq("assigned_caller_id", id);
    await admin.from("leads").update({ assigned_caller_id: null }).eq("assigned_caller_id", id);
    await admin.from("todos").update({ assigned_caller_id: null }).eq("assigned_caller_id", id);
    await admin.from("appointments").update({ caller_id: null }).eq("caller_id", id);
    await admin.from("caller_account_links").delete().eq("caller_id", id);

    if (prof?.avatar_url) await admin.storage.from("caller-avatars").remove([prof.avatar_url]);

    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
