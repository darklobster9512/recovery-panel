import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTelegramNotification, type TelegramEvent } from "../_shared/telegram.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED: TelegramEvent[] = [
  "lead_note_added",
  "vic_note_added",
  "document_uploaded",
  "assignment_created",
  "assignment_completed",
  "anosim_sms_received",
  "user_account_created",
  "tan_forwarded_to_vic",
  "kyc_data_extracted",
  "todo_completed",
  "test",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Any authenticated user can trigger their own contextual notifications
    // (e.g. Vic uploads document, Vic completes assignment). Admin gate is
    // not required — the payload is server-formatted and cannot inject markup.

    const body = await req.json().catch(() => ({}));
    const event = body?.event as TelegramEvent;
    const payload = (body?.payload ?? {}) as Record<string, unknown>;
    const chatIdOverride =
      typeof body?.chat_id_override === "string" ? body.chat_id_override : undefined;

    if (!event || !ALLOWED.includes(event)) {
      return new Response(JSON.stringify({ error: "Invalid event" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // For test / override, require admin
    if (chatIdOverride) {
      const { data: isAdmin } = await anonClient.rpc("has_role", {
        _user_id: claimsData.claims.sub,
        _role: "admin",
      });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const result = await sendTelegramNotification(serviceClient, event, payload, {
      chatIdOverride,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("telegram-notify error:", err);
    return new Response(JSON.stringify({ error: "Internal error", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
