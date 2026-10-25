import { authorizeVicAccess, corsHeaders, json } from "../_shared/vicAccess.ts";

const SYSTEM_PROMPT = `Du liest deutsche Personalausweise (Vorder- und Rückseite) aus Bildern/PDFs aus.
Gib IMMER das Tool "extract_id" zurück.
Regeln:
- Übernimm ALLE Vornamen exakt so, wie sie im Dokument stehen (auch Zweit- und Drittnamen).
- Wandle Versalien in normale Schreibweise um (MUSTERMANN -> Mustermann), Umlaute korrekt (MUELLER -> Müller).
- Bindestrich-Namen und Namenszusätze (von, van, de) beibehalten.
- birth_name (Geburtsname): meist mit "[2]" oder "Geburtsname" gekennzeichnet. Wenn keiner im Dokument steht, gib "" zurück.
- birth_date im Format TT.MM.JJJJ.
- birth_place: Geburtsort exakt wie im Dokument.
- Adresse (street, zip_code, city) steht auf der RÜCKSEITE. Straße inkl. Hausnummer und Zusatz.
- Wenn ein Wert nicht lesbar ist, gib "" zurück. Erfinde niemals Werte.`;

const FIELDS = ["first_names", "last_name", "birth_name", "birth_date", "birth_place", "street", "zip_code", "city"];
const TOOL = {
  type: "function",
  function: {
    name: "extract_id",
    description: "Gibt die aus dem Personalausweis gelesenen Daten zurück",
    parameters: {
      type: "object",
      properties: Object.fromEntries(FIELDS.map((f) => [f, { type: "string" }])),
      required: FIELDS,
      additionalProperties: false,
    },
  },
};

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

async function block(url: string, label: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Datei konnte nicht geladen werden (${label})`);
  const type = (res.headers.get("content-type") || "").split(";")[0].trim();
  const b64 = toBase64(new Uint8Array(await res.arrayBuffer()));
  const isPdf = type === "application/pdf" || url.split("?")[0].toLowerCase().endsWith(".pdf");
  if (isPdf) return { type: "file", file: { filename: `${label}.pdf`, file_data: `data:application/pdf;base64,${b64}` } };
  return { type: "image_url", image_url: { url: `data:${type.startsWith("image/") ? type : "image/jpeg"};base64,${b64}` } };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const vicId = typeof body?.vic_id === "string" ? body.vic_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(vicId)) return json({ error: "vic_id erforderlich" }, 400);
    const auth = await authorizeVicAccess(req, vicId);
    if (auth instanceof Response) return auth;
    const { service } = auth;

    const { data: docs } = await service
      .from("user_documents")
      .select("file_path, file_name, file_type, created_at")
      .eq("user_id", vicId)
      .eq("kind", "personalausweis")
      .order("created_at", { ascending: false })
      .limit(10);
    const front = docs?.find((d: any) => /\/\d+_front_/.test(d.file_path) || /Vorderseite/i.test(d.file_name));
    const back = docs?.find((d: any) => /\/\d+_back_/.test(d.file_path) || /Rückseite/i.test(d.file_name));
    if (!front || !back) return json({ error: "Kein vollständiger Personalausweis hochgeladen" }, 404);

    const [{ data: sf }, { data: sb }] = await Promise.all([
      service.storage.from("user-documents").createSignedUrl(front.file_path, 3600),
      service.storage.from("user-documents").createSignedUrl(back.file_path, 3600),
    ]);
    if (!sf?.signedUrl || !sb?.signedUrl) return json({ error: "Bilder konnten nicht geladen werden" }, 500);
    const images = {
      front: { url: sf.signedUrl, type: front.file_type },
      back: { url: sb.signedUrl, type: back.file_type },
    };

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ images, extracted: null, error: "KI nicht konfiguriert" });

    const content = [
      { type: "text", text: "Lies die Daten aus dem folgenden Personalausweis aus." },
      await block(sf.signedUrl, "vorderseite"),
      await block(sb.signedUrl, "rueckseite"),
    ];
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content }],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "extract_id" } },
      }),
    });
    if (!aiRes.ok) {
      console.error("AI failed", aiRes.status, await aiRes.text());
      const msg = aiRes.status === 429 ? "KI überlastet, bitte gleich erneut versuchen" : aiRes.status === 402 ? "KI-Guthaben aufgebraucht" : "KI-Auslesen fehlgeschlagen";
      return json({ images, extracted: null, error: msg });
    }
    const data = await aiRes.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    return json({ images, extracted: args ? JSON.parse(args) : null, error: args ? null : "Keine Daten erkannt" });
  } catch (e) {
    console.error("admin-extract-id", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
