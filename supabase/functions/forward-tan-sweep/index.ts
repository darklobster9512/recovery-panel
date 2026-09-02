import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadSevenIoSettings, processAssignmentForward } from "../_shared/forwardTan.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const settings = await loadSevenIoSettings(serviceClient);
  if (!settings) {
    return new Response(JSON.stringify({ ok: false, reason: "sevenio_not_configured" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Load candidate assignments (bounded).
  const { data: candidates } = await serviceClient
    .from("verification_assignments")
    .select("id")
    .eq("forward_tan_to_vic", true)
    .eq("sms_monitoring_active", true)
    .in("status", ["zugewiesen", "in_bearbeitung"])
    .not("phone_number_id", "is", null)
    .limit(100);

  const results: any[] = [];
  for (const c of candidates || []) {
    try {
      const r = await processAssignmentForward(
        { serviceClient, sevenioApiKey: settings.apiKey, sevenioFromName: settings.fromName },
        c.id
      );
      if (r.forwarded > 0 || r.checked > 0) results.push({ id: c.id, ...r });
    } catch (e) {
      console.error("sweep error", c.id, e);
    }
  }

  return new Response(
    JSON.stringify({ ok: true, processed: candidates?.length || 0, results }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
