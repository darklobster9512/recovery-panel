import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { auftragKey, identcodeFromLink } from "../_shared/auftrag.ts";

Deno.test("identcode is last 9-digit number of identlink", () => {
  assertEquals(identcodeFromLink("https://webid-gateway.de/service/qa/cn/000347/aid/694977088"), "694977088");
  assertEquals(identcodeFromLink("https://x.de/abc"), "");
});

Deno.test("auftragKey matches request names", () => {
  assertEquals(auftragKey({ title: "Deutsche Bank — Video-Ident", type: "videocall" }), "DeutscheBank-videoident");
  assertEquals(auftragKey({ title: "Santander — Postident", type: "postident" }), "Santander-postident");
});

const URL_ = `${Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL")}/functions/v1/prepare-results`;
Deno.test("rejects unknown request_id and bad body", async () => {
  const bad = await fetch(URL_, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  await bad.text();
  assertEquals(bad.status, 400);
  const unk = await fetch(URL_, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request_id: crypto.randomUUID(), results: [{ auftrag: "DKB-videoident", success: false }] }),
  });
  await unk.text();
  assertEquals(unk.status, 404);
});
