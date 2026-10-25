import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

/** Checks that the caller is an admin, or a caller assigned to the given Vic. */
export async function authorizeVicAccess(
  req: Request,
  vicId: string,
): Promise<{ service: SupabaseClient; userId: string } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await anon.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (error || !data?.claims?.sub) return json({ error: "Unauthorized" }, 401);
  const userId = data.claims.sub as string;
  const service = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: roles } = await service.from("user_roles").select("role").eq("user_id", userId);
  const r = (roles ?? []).map((x: any) => x.role);
  if (r.includes("admin")) return { service, userId };
  if (r.includes("caller")) {
    const { data: p } = await service.from("profiles").select("assigned_caller_id").eq("id", vicId).maybeSingle();
    if (p?.assigned_caller_id === userId) return { service, userId };
  }
  return json({ error: "Forbidden" }, 403);
}
