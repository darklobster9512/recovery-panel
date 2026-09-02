import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function validatePassword(password: unknown): string | null {
  if (typeof password !== "string") return "Password must be a string";
  if (!/^[a-z0-9]{6,32}$/.test(password)) {
    return "Password must be 6-32 characters, lowercase letters and digits only";
  }
  return null;
}

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

    // Verify caller is admin
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

    const adminUserId = claimsData.claims.sub;

    // Check admin role
    const { data: isAdmin } = await anonClient.rpc("has_role", {
      _user_id: adminUserId,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, first_name, last_name, phone, password, balance, scam_project } = body;

    if (!email || !first_name || !last_name) {
      return new Response(JSON.stringify({ error: "email, first_name, last_name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return new Response(JSON.stringify({ error: passwordError }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to create user (does NOT affect admin session)
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update profile with extra fields (trigger already created the row)
    const updatePayload: Record<string, unknown> = {
      first_name,
      last_name,
      phone: phone || null,
      temp_password: password,
    };

    if (balance !== undefined && balance !== null && balance !== "") {
      const parsedBalance = parseFloat(balance);
      if (!Number.isNaN(parsedBalance)) {
        updatePayload.balance = parsedBalance;
      }
    }

    if (scam_project !== undefined && scam_project !== null) {
      updatePayload.scam_project = scam_project;
    }

    const { error: updateError } = await adminClient
      .from("profiles")
      .update(updatePayload)
      .eq("id", newUser.user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
    }

    return new Response(
      JSON.stringify({
        id: newUser.user.id,
        email,
        first_name,
        last_name,
        phone: phone || null,
        temp_password: password,
        balance: updatePayload.balance ?? null,
        scam_project: updatePayload.scam_project ?? null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
