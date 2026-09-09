import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTelegramNotification } from "../_shared/telegram.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function str(v: unknown, max = 2000): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, max);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));

    const first_name = str(body.first_name ?? body.firstName, 120);
    const last_name = str(body.last_name ?? body.lastName, 120);
    const email = str(body.email, 255);
    const phone = str(body.phone ?? body.telefon, 60);
    const topic = str(body.topic ?? body.anliegen, 255);
    const message = str(body.message ?? body.nachricht, 5000);
    const source = str(body.source, 120);

    let damage_amount: number | null = null;
    const rawAmount = body.damage_amount ?? body.schadenshoehe;
    if (rawAmount !== undefined && rawAmount !== null && String(rawAmount).trim() !== "") {
      const n = Number(String(rawAmount).replace(",", ".").replace(/[^0-9.\-]/g, ""));
      if (Number.isFinite(n)) damage_amount = n;
    }

    if (!first_name || !last_name || !email || !topic || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields", required: ["first_name", "last_name", "email", "topic", "message"] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("contact_requests")
      .insert({
        first_name,
        last_name,
        email,
        phone,
        topic,
        damage_amount,
        message,
        source,
      })
      .select("id")
      .single();

    if (error) {
      console.error("insert contact_requests failed:", error);
      return new Response(JSON.stringify({ error: "Failed to store request" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fire-and-forget Telegram notification
    sendTelegramNotification(supabase, "contact_request_received", {
      name: `${first_name} ${last_name}`,
      email,
      phone,
      topic,
      damage_amount: damage_amount !== null ? damage_amount : undefined,
      message,
    }).catch((e) => console.error("telegram notify failed:", e));

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("contact-submit error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
