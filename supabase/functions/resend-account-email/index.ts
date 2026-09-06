import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  AppSettings,
  buildLoginUrl,
  buildWebsiteUrl,
  renderCredentialsEmail,
} from "../_shared/emailTemplate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(401, { error: "Unauthorized" });

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json(401, { error: "Unauthorized" });

    const { data: isAdmin } = await anonClient.rpc("has_role", {
      _user_id: claimsData.claims.sub,
      _role: "admin",
    });
    if (!isAdmin) return json(403, { error: "Forbidden: admin role required" });

    const { user_id } = await req.json();
    if (typeof user_id !== "string" || !user_id) return json(400, { error: "user_id required" });

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("email, first_name, last_name, temp_password")
      .eq("id", user_id)
      .maybeSingle();
    if (profileError) return json(500, { error: profileError.message });
    if (!profile) return json(404, { error: "Profil nicht gefunden" });
    if (!profile.email) return json(400, { error: "Vic hat keine Email-Adresse" });
    if (!profile.temp_password) return json(400, { error: "Kein Klartext-Passwort gespeichert" });

    const { data: settings } = await adminClient
      .from("app_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle();
    if (!settings) return json(500, { error: "app_settings fehlt" });
    const s = settings as AppSettings;
    if (!s.resend_api_key || !s.resend_from_email) {
      return json(400, { error: "Resend ist nicht konfiguriert" });
    }

    const html = renderCredentialsEmail(
      {
        firstName: profile.first_name ?? "",
        lastName: profile.last_name ?? "",
        email: profile.email,
        password: profile.temp_password,
        loginUrl: buildLoginUrl(s),
        websiteUrl: buildWebsiteUrl(s),
      },
      s,
    );

    const from = s.resend_from_name
      ? `${s.resend_from_name} <${s.resend_from_email}>`
      : s.resend_from_email;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${s.resend_api_key}`,
      },
      body: JSON.stringify({
        from,
        to: [profile.email],
        subject: `Ihr Fall bei ${s.company_name || "unserer Kanzlei"}`,
        html,
      }),
    });
    const body = await res.text();
    if (!res.ok) return json(res.status, { error: "Resend Fehler", details: body });

    return json(200, { ok: true });
  } catch (e) {
    console.error("resend-account-email error", e);
    return json(500, { error: String(e) });
  }
});
