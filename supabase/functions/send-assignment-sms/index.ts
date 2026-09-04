import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? "");
}

function buildLoginUrl(website: string, prefix: string): string {
  const w = (website || "").trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const p = (prefix || "").trim().replace(/\.+$/, "");
  const host = p ? `${p}.${w}` : w;
  return `https://${host}/auth`;
}

async function sendSms(apiKey: string, from: string | null, to: string, text: string) {
  const params = new URLSearchParams({ to, text });
  if (from) params.set("from", from);
  const res = await fetch("https://gateway.seven.io/api/sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Api-Key": apiKey,
      Accept: "application/json",
    },
    body: params.toString(),
  });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { assignment_id } = await req.json().catch(() => ({}));
    if (!assignment_id || typeof assignment_id !== "string") {
      return new Response(JSON.stringify({ error: "assignment_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: assignment, error: aErr } = await admin
      .from("verification_assignments")
      .select("id, user_id, verification_id")
      .eq("id", assignment_id)
      .maybeSingle();
    if (aErr || !assignment) {
      return new Response(JSON.stringify({ error: "assignment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: profile }, { data: verification }, { data: settings }, { data: tpl }] = await Promise.all([
      admin.from("profiles").select("first_name, last_name, phone").eq("id", assignment.user_id).maybeSingle(),
      admin.from("verifications").select("title").eq("id", assignment.verification_id).maybeSingle(),
      admin.from("app_settings").select("*").eq("id", true).maybeSingle(),
      admin.from("sms_templates_config").select("content").eq("key", "assignment_created_sms").maybeSingle(),
    ]);

    const phone = (profile as any)?.phone as string | undefined;
    if (!phone) {
      return new Response(JSON.stringify({ skipped: true, reason: "no phone" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const content = (tpl as any)?.content as string | undefined;
    if (!content) {
      return new Response(JSON.stringify({ skipped: true, reason: "no template" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const s = settings as any;
    if (!s?.sevenio_api_key) {
      return new Response(JSON.stringify({ skipped: true, reason: "seven.io not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = renderTemplate(content, {
      first_name: (profile as any)?.first_name ?? "",
      last_name: (profile as any)?.last_name ?? "",
      verification_title: (verification as any)?.title ?? "",
      company_name: s.company_name ?? "",
      login_url: buildLoginUrl(s.website ?? "", s.panel_subprefix ?? ""),
    });

    const result = await sendSms(s.sevenio_api_key, s.sevenio_from_name ?? null, phone, text);
    return new Response(JSON.stringify({ ok: result.ok, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
