import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anon = createClient(url, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: claims, error: cErr } = await anon.auth.getClaims(auth.replace("Bearer ", ""));
    if (cErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const me = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const target = typeof body?.target_caller_id === "string" ? body.target_caller_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(target) || target === me) return json({ error: "Ungültiges Ziel" }, 400);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: links } = await admin.from("caller_account_links").select("caller_id, group_id").in("caller_id", [me, target]);
    const a = links?.find((l) => l.caller_id === me);
    const b = links?.find((l) => l.caller_id === target);
    if (!a || !b || a.group_id !== b.group_id) return json({ error: "Konten sind nicht verknüpft" }, 403);

    const { data: roles } = await admin.from("user_roles").select("user_id").eq("role", "caller").in("user_id", [me, target]);
    if ((roles ?? []).length !== 2) return json({ error: "Nur Caller-Konten können wechseln" }, 403);

    const { data: u, error: uErr } = await admin.auth.admin.getUserById(target);
    if (uErr || !u?.user?.email) return json({ error: "Zielkonto nicht gefunden" }, 404);

    const { data: link, error: lErr } = await admin.auth.admin.generateLink({ type: "magiclink", email: u.user.email });
    if (lErr || !link?.properties?.hashed_token) return json({ error: lErr?.message ?? "Link fehlgeschlagen" }, 500);

    const pub = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data: sess, error: vErr } = await pub.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
    if (vErr || !sess?.session) return json({ error: vErr?.message ?? "Anmeldung fehlgeschlagen" }, 500);

    return json({ access_token: sess.session.access_token, refresh_token: sess.session.refresh_token });
  } catch (e) {
    console.error("caller-switch", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
