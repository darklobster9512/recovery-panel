import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTelegramNotification } from "../_shared/telegram.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Du liest deutsche Personalausweise (Vorder- und Rückseite) aus Bildern/PDFs aus.
Gib IMMER das Tool "extract_id" zurück.
Regeln:
- Übernimm ALLE Vornamen exakt so, wie sie im Dokument stehen (auch Zweit- und Drittnamen).
- Wandle Versalien in normale Schreibweise um (MUSTERMANN -> Mustermann), Umlaute korrekt (MUELLER -> Müller, "MÜLLER" -> Müller).
- Bindestrich-Namen und Adels-/Namenszusätze (von, van, de) beibehalten.
- birth_name (Geburtsname): auf dem deutschen Personalausweis meist mit "[2]" oder "Geburtsname" gekennzeichnet (z.B. "MÜLLER [2]"). Übernimm ihn exakt in normale Schreibweise. Wenn kein Geburtsname im Dokument steht, gib "" zurück.
- birth_date im Format TT.MM.JJJJ.
- birth_place: Geburtsort exakt wie im Dokument.
- Adresse (street, zip_code, city) steht beim deutschen Personalausweis auf der RÜCKSEITE. Straße inkl. Hausnummer und Zusatz (z.B. "Wilhelm-Busch-Str. 18 A").
- Wenn ein Wert nicht lesbar ist, gib "" zurück. Erfinde niemals Werte.`;

const TOOL = {
  type: "function",
  function: {
    name: "extract_id",
    description: "Gibt die aus dem Personalausweis gelesenen Daten zurück",
    parameters: {
      type: "object",
      properties: {
        first_names: { type: "string" },
        last_name: { type: "string" },
        birth_name: { type: "string" },
        birth_date: { type: "string" },
        birth_place: { type: "string" },
        street: { type: "string" },
        zip_code: { type: "string" },
        city: { type: "string" },
      },
      required: ["first_names", "last_name", "birth_name", "birth_date", "birth_place", "street", "zip_code", "city"],
      additionalProperties: false,
    },
  },
};

function toBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function buildBlock(url: string, label: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Datei konnte nicht geladen werden (${label}): ${res.status}`);
  const type = (res.headers.get("content-type") || "").split(";")[0].trim();
  const buf = await res.arrayBuffer();
  if (!buf.byteLength) throw new Error(`Datei ist leer (${label})`);
  const isPdf = type === "application/pdf" || url.toLowerCase().split("?")[0].endsWith(".pdf");
  const b64 = toBase64(buf);
  if (isPdf) {
    return {
      type: "file",
      file: { filename: `${label}.pdf`, file_data: `data:application/pdf;base64,${b64}` },
    };
  }
  const mime = type.startsWith("image/") ? type : "image/jpeg";
  return { type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anon.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const front_path = typeof body?.front_path === "string" ? body.front_path : "";
    const back_path = typeof body?.back_path === "string" ? body.back_path : "";
    if (!front_path || !back_path) {
      return new Response(JSON.stringify({ error: "front_path and back_path required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Ensure user owns the files (paths start with `<user_id>/`)
    const userId = claimsData.claims.sub as string;
    if (!front_path.startsWith(`${userId}/`) || !back_path.startsWith(`${userId}/`)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: signedFront }, { data: signedBack }] = await Promise.all([
      service.storage.from("user-documents").createSignedUrl(front_path, 300),
      service.storage.from("user-documents").createSignedUrl(back_path, 300),
    ]);
    if (!signedFront?.signedUrl || !signedBack?.signedUrl) {
      return new Response(JSON.stringify({ error: "Signed URL failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY nicht konfiguriert" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content: any[] = [
      { type: "text", text: "Lies die Daten aus dem folgenden Personalausweis aus." },
      await buildBlock(signedFront.signedUrl, "vorderseite"),
      await buildBlock(signedBack.signedUrl, "rueckseite"),
    ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "extract_id" } },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      console.error(`AI gateway failed [${aiRes.status}]:`, text);
      return new Response(JSON.stringify({ error: "AI request failed", status: aiRes.status, details: text }), {
        status: aiRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Keine Daten erkannt" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(call.function.arguments);

    // Vic name for Telegram
    const { data: prof } = await service
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", userId)
      .maybeSingle();
    const vicName =
      `${prof?.first_name ?? ""} ${prof?.last_name ?? ""}`.trim() || prof?.email || "Unbekannt";

    const result = await sendTelegramNotification(service, "kyc_data_extracted", {
      vic_name: vicName,
      ...parsed,
    });

    return new Response(JSON.stringify({ ok: true, extracted: parsed, telegram: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-id-data error:", e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
