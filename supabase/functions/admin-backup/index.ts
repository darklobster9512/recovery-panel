import { createClient } from "npm:@supabase/supabase-js@2";
import postgres from "npm:postgres@3.4.4";
import JSZip from "npm:jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const EXTRA_TABLES = ["auth.users", "auth.identities"];

type TableInfo = { key: string; schema: string; name: string; pk: string[]; cols: string[] };

const qi = (s: string) => '"' + s.replace(/"/g, '""') + '"';

async function loadTables(sql: postgres.Sql): Promise<TableInfo[]> {
  const rows = await sql`
    SELECT c.table_schema AS schema, c.table_name AS name,
      array_agg(c.column_name::text ORDER BY c.ordinal_position)
        FILTER (WHERE c.is_generated = 'NEVER' AND COALESCE(c.identity_generation,'') <> 'ALWAYS') AS cols
    FROM information_schema.columns c
    JOIN information_schema.tables t ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE t.table_type = 'BASE TABLE'
      AND (c.table_schema = 'public' OR (c.table_schema || '.' || c.table_name) = ANY(${EXTRA_TABLES}))
    GROUP BY c.table_schema, c.table_name`;
  const pks = await sql`
    SELECT n.nspname AS schema, cl.relname AS name,
      array_agg(a.attname::text ORDER BY array_position(i.indkey, a.attnum)) AS pk
    FROM pg_index i
    JOIN pg_class cl ON cl.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = cl.relnamespace
    JOIN pg_attribute a ON a.attrelid = cl.oid AND a.attnum = ANY(i.indkey)
    WHERE i.indisprimary AND n.nspname IN ('public','auth')
    GROUP BY n.nspname, cl.relname`;
  const fks = await sql`
    SELECT sn.nspname || '.' || s.relname AS src, tn.nspname || '.' || t.relname AS dst
    FROM pg_constraint con
    JOIN pg_class s ON s.oid = con.conrelid JOIN pg_namespace sn ON sn.oid = s.relnamespace
    JOIN pg_class t ON t.oid = con.confrelid JOIN pg_namespace tn ON tn.oid = t.relnamespace
    WHERE con.contype = 'f'`;
  const pkMap = new Map(pks.map((p: any) => [`${p.schema}.${p.name}`, p.pk as string[]]));
  const tables: TableInfo[] = rows.map((r: any) => ({
    key: `${r.schema}.${r.name}`,
    schema: r.schema,
    name: r.name,
    pk: pkMap.get(`${r.schema}.${r.name}`) ?? [],
    cols: r.cols ?? [],
  }));
  // topological sort (dependencies first)
  const keys = new Set(tables.map((t) => t.key));
  const deps = new Map<string, Set<string>>();
  tables.forEach((t) => deps.set(t.key, new Set()));
  for (const f of fks as any[]) {
    if (keys.has(f.src) && keys.has(f.dst) && f.src !== f.dst) deps.get(f.src)!.add(f.dst);
  }
  const ordered: TableInfo[] = [];
  const done = new Set<string>();
  const visiting = new Set<string>();
  const byKey = new Map(tables.map((t) => [t.key, t]));
  const visit = (k: string) => {
    if (done.has(k) || visiting.has(k)) return;
    visiting.add(k);
    deps.get(k)!.forEach(visit);
    visiting.delete(k);
    done.add(k);
    ordered.push(byKey.get(k)!);
  };
  [...keys].sort().forEach(visit);
  return ordered;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Ungültige Anfrage" }, 400); }
  const action = body?.action;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let isCron = false;

  if (action === "telegram" && typeof body?.cron_token === "string") {
    const { data: ok } = await admin.rpc("backup_check_token", { _token: body.cron_token });
    if (!ok) return json({ error: "Nicht autorisiert" }, 401);
    isCron = true;
  } else {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Nicht autorisiert" }, 401);
    const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await anon.auth.getClaims(authHeader.slice(7));
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Nicht autorisiert" }, 401);
    const { data: role } = await admin
      .from("user_roles").select("role").eq("user_id", claims.claims.sub).eq("role", "admin").maybeSingle();
    if (!role) return json({ error: "Nur für Admins" }, 403);
  }

  const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 1 });
  try {
    const tables = await loadTables(sql);
    const find = (key: unknown) => tables.find((t) => t.key === key);

    if (action === "list") {
      const out = [];
      for (const t of tables) {
        const [{ n }] = await sql.unsafe(`SELECT count(*)::int AS n FROM ${qi(t.schema)}.${qi(t.name)}`);
        out.push({ key: t.key, count: n });
      }
      return json({ tables: out });
    }

    if (action === "export") {
      const t = find(body.table);
      if (!t) return json({ error: "Unbekannte Tabelle" }, 400);
      const offset = Math.max(0, Number(body.offset) || 0);
      const limit = Math.min(5000, Math.max(1, Number(body.limit) || 2000));
      const order = t.pk.length ? `ORDER BY ${t.pk.map(qi).join(",")}` : "ORDER BY ctid";
      const [{ rows }] = await sql.unsafe(
        `SELECT COALESCE(json_agg(x), '[]'::json) AS rows FROM (SELECT * FROM ${qi(t.schema)}.${qi(t.name)} ${order} LIMIT ${limit} OFFSET ${offset}) x`,
      );
      return json({ rows });
    }

    if (action === "import") {
      const t = find(body.table);
      if (!t) return json({ error: "Unbekannte Tabelle" }, 400);
      let rows = body.rows;
      if (typeof rows === "string") { try { rows = JSON.parse(rows); } catch (_) { /* invalid */ } }
      if (!Array.isArray(rows)) return json({ error: "rows fehlt" }, 400);
      if (rows.length === 0) return json({ inserted: 0 });
      const overwrite = body.mode === "overwrite";
      // only columns that exist now AND appear in backup
      const present = new Set<string>();
      rows.slice(0, 50).forEach((r: any) => Object.keys(r ?? {}).forEach((k) => present.add(k)));
      const cols = t.cols.filter((c) => present.has(c));
      if (!cols.length) return json({ inserted: 0 });
      const colList = cols.map(qi).join(",");
      const target = `${qi(t.schema)}.${qi(t.name)}`;
      let conflict = "ON CONFLICT DO NOTHING";
      if (overwrite && t.pk.length) {
        const upd = cols.filter((c) => !t.pk.includes(c));
        conflict = upd.length
          ? `ON CONFLICT (${t.pk.map(qi).join(",")}) DO UPDATE SET ${upd.map((c) => `${qi(c)} = EXCLUDED.${qi(c)}`).join(",")}`
          : "ON CONFLICT DO NOTHING";
      }
      const result = await sql.begin(async (tx) => {
        try { await tx.unsafe("SET LOCAL session_replication_role = replica"); } catch (_) { /* ignore */ }
        const r = await tx.unsafe(
          `INSERT INTO ${target} (${colList}) SELECT ${colList} FROM json_populate_recordset(NULL::${target}, $1::text::json) ${conflict}`,
          [JSON.stringify(rows)],
        );
        return r.count;
      });
      return json({ inserted: result, received: rows.length });
    }

    if (action === "telegram") {
      const { data: st } = await admin.from("app_settings")
        .select("backup_telegram_chat_id, backup_enabled, company_name").eq("id", true).maybeSingle();
      if (isCron && !st?.backup_enabled) return json({ skipped: true });
      const chatId = (st?.backup_telegram_chat_id ?? "").trim();
      const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
      const fail = async (msg: string) => {
        await admin.from("app_settings").update({ backup_last_error: msg }).eq("id", true);
        return json({ error: msg }, 400);
      };
      if (!chatId) return await fail("Keine Telegram-Chat-ID hinterlegt");
      if (!token) return await fail("TELEGRAM_BOT_TOKEN fehlt");
      const z = new JSZip();
      const manifestTables: { key: string; count: number }[] = [];
      let totalRows = 0;
      for (const t of tables) {
        const order = t.pk.length ? `ORDER BY ${t.pk.map(qi).join(",")}` : "";
        const [{ rows }] = await sql.unsafe(
          `SELECT COALESCE(json_agg(x), '[]'::json) AS rows FROM (SELECT * FROM ${qi(t.schema)}.${qi(t.name)} ${order}) x`,
        );
        const arr = rows as unknown[];
        manifestTables.push({ key: t.key, count: arr.length });
        totalRows += arr.length;
        z.file(`${t.key}.json`, JSON.stringify(arr));
      }
      const created = new Date().toISOString();
      z.file("manifest.json", JSON.stringify({ version: 1, created_at: created, tables: manifestTables }, null, 2));
      const bytes = await z.generateAsync({ type: "uint8array", compression: "DEFLATE" });
      if (bytes.byteLength > 49 * 1024 * 1024) return await fail("Backup größer als 50 MB – Telegram-Limit");
      const fname = `backup-${created.slice(0, 19).replace(/[:T]/g, "-")}.zip`;
      const form = new FormData();
      form.append("chat_id", chatId);
      form.append("caption", `🗄 Backup ${st?.company_name ?? ""}\n${new Date(created).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}\n${tables.length} Tabellen, ${totalRows} Einträge`);
      form.append("document", new Blob([bytes], { type: "application/zip" }), fname);
      const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, { method: "POST", body: form });
      const tg = await res.json().catch(() => ({}));
      if (!res.ok || !tg?.ok) return await fail(`Telegram: ${tg?.description ?? res.status}`);
      await admin.from("app_settings").update({ backup_last_at: created, backup_last_error: null }).eq("id", true);
      return json({ ok: true, tables: tables.length, rows: totalRows, bytes: bytes.byteLength });
    }

    return json({ error: "Unbekannte Aktion" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  } finally {
    await sql.end({ timeout: 2 });
  }
});
