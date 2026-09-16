import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return json({ error: "Forbidden" }, 403);

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: userData } = await userClient.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return json({ error: "Forbidden" }, 403);

  const { data: isAdmin } = await userClient.rpc("has_role", {
    _user_id: uid,
    _role: "admin",
  });
  const { data: isCaller } = await userClient.rpc("has_role", {
    _user_id: uid,
    _role: "caller",
  });
  if (!isAdmin && !isCaller) return json({ error: "Forbidden" }, 403);

  let paths: unknown;
  try {
    paths = (await req.json())?.paths;
  } catch {
    return json({ error: "invalid body" }, 400);
  }
  if (!Array.isArray(paths) || paths.length === 0 || !paths.every((p) => typeof p === "string")) {
    return json({ error: "paths must be a non-empty string array" }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (!isAdmin) {
    // Caller: only files of vics assigned to them
    const ownerIds = [...new Set((paths as string[]).map((p) => p.split("/")[0]))];
    if (ownerIds.some((id) => !id)) return json({ error: "Forbidden" }, 403);
    const { data: allowed, error: profErr } = await admin
      .from("profiles")
      .select("id")
      .in("id", ownerIds)
      .eq("assigned_caller_id", uid);
    if (profErr) return json({ error: "Forbidden" }, 403);
    if ((allowed?.length ?? 0) !== ownerIds.length) {
      return json({ error: "Forbidden" }, 403);
    }
  }

  const { data, error } = await admin.storage
    .from("user-documents")
    .remove(paths as string[]);

  return json({ data, error });
});
