import { createClient } from "npm:@supabase/supabase-js@2";
import postgres from "npm:postgres@3.4.4";
import JSZip from "npm:jszip@3.10.1";
import { brandWhere, fileInBrand, importOrder, BRAND_PEOPLE } from "../_shared/backupScope.ts";

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

const MAX_PART = 45 * 1024 * 1024;

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

  const brandId: string | null = typeof body?.branding_id === "string" && /^[0-9a-f-]{36}$/i.test(body.branding_id)
    ? body.branding_id : null;

  const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 1 });
  try {
    const allTables = await loadTables(sql);
    const byKey = new Map(allTables.map((t) => [t.key, t]));
    const ordered = importOrder(allTables.map((t) => t.key)).map((k) => byKey.get(k)!)
      .filter((t) => brandWhere(t.key, t.cols) !== "EXCLUDE");
    const find = (key: unknown) => ordered.find((t) => t.key === key);

    // WHERE + params for a table, scoped to brand when given
    const scope = (t: TableInfo, bid: string | null): { where: string; params: unknown[] } => {
      if (!bid) return { where: "", params: [] };
      const w = brandWhere(t.key, t.cols);
      if (!w || w === "EXCLUDE") return { where: "", params: [] };
      return { where: `WHERE ${w}`, params: [bid] };
    };
    const selectRows = async (t: TableInfo, bid: string | null, extra = "") => {
      const s = scope(t, bid);
      const order = t.pk.length ? `ORDER BY ${t.pk.map(qi).join(",")}` : "ORDER BY ctid";
      const [{ rows }] = await sql.unsafe(
        `SELECT COALESCE(json_agg(x), '[]'::json) AS rows FROM (SELECT * FROM ${qi(t.schema)}.${qi(t.name)} ${s.where} ${order} ${extra}) x`,
        s.params as any[],
      );
      return rows as unknown[];
    };
    const listFiles = async (bid: string | null) => {
      const files = await sql`SELECT bucket_id AS bucket, name, COALESCE((metadata->>'size')::bigint, 0) AS size
        FROM storage.objects WHERE name NOT LIKE '%.emptyFolderPlaceholder' ORDER BY bucket_id, name`;
      if (!bid) return files as any[];
      const people = new Set((await sql.unsafe(`SELECT id::text FROM ${BRAND_PEOPLE.slice(1, -1)}`, [bid]) as any[]).map((r) => r.id));
      return (files as any[]).filter((f) => fileInBrand(f.bucket, f.name, people));
    };
    const brands = async () =>
      (await sql`SELECT id, company_name FROM public.brandings ORDER BY created_at`) as any[];

    if (action === "list") {
      const out = [];
      for (const t of ordered) {
        const s = scope(t, brandId);
        const [{ n }] = await sql.unsafe(`SELECT count(*)::int AS n FROM ${qi(t.schema)}.${qi(t.name)} ${s.where}`, s.params as any[]);
        const w = brandWhere(t.key, t.cols);
        out.push({ key: t.key, count: n, cols: t.cols, global: brandId ? w === null : false });
      }
      return json({ tables: out, brandings: await brands() });
    }

    if (action === "export") {
      const t = find(body.table);
      if (!t) return json({ error: "Unbekannte Tabelle" }, 400);
      const offset = Math.max(0, Number(body.offset) || 0);
      const limit = Math.min(5000, Math.max(1, Number(body.limit) || 2000));
      return json({ rows: await selectRows(t, brandId, `LIMIT ${limit} OFFSET ${offset}`) });
    }

    if (action === "list_files") return json({ files: await listFiles(brandId) });

    if (action === "file_url") {
      const { data, error } = await admin.storage.from(String(body.bucket)).createSignedUrl(String(body.path), 600);
      if (error) return json({ error: error.message }, 400);
      return json({ url: data.signedUrl });
    }

    if (action === "file_upload_url") {
      const bucket = String(body.bucket), path = String(body.path);
      if (body.mode !== "overwrite") {
        const [hit] = await sql`SELECT 1 FROM storage.objects WHERE bucket_id = ${bucket} AND name = ${path}`;
        if (hit) return json({ exists: true });
      }
      const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(path, { upsert: true });
      if (error) return json({ error: error.message }, 400);
      return json({ path: data.path, token: data.token });
    }

    if (action === "import") {
      const t = find(body.table);
      if (!t) return json({ error: "Tabelle existiert nicht mehr" }, 400);
      let rows = body.rows;
      if (typeof rows === "string") { try { rows = JSON.parse(rows); } catch (_) { /* invalid */ } }
      if (!Array.isArray(rows)) return json({ error: "rows fehlt" }, 400);
      if (rows.length === 0) return json({ inserted: 0 });
      const overwrite = body.mode === "overwrite";
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
        .select("backup_telegram_chat_id, backup_enabled").eq("id", true).maybeSingle();
      if (isCron && !st?.backup_enabled) return json({ skipped: true });
      const chatId = (st?.backup_telegram_chat_id ?? "").trim();
      const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
      const fail = async (msg: string) => {
        await admin.from("app_settings").update({ backup_last_error: msg }).eq("id", true);
        return json({ error: msg }, 400);
      };
      if (!chatId) return await fail("Keine Telegram-Chat-ID hinterlegt");
      if (!token) return await fail("TELEGRAM_BOT_TOKEN fehlt");
      const created = new Date().toISOString();
      const stamp = created.slice(0, 19).replace(/[:T]/g, "-");
      const when = new Date(created).toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
      const brandList = await brands();
      const send = async (bytes: Uint8Array, fname: string, caption: string) => {
        const form = new FormData();
        form.append("chat_id", chatId);
        form.append("caption", caption);
        form.append("document", new Blob([bytes], { type: "application/zip" }), fname);
        const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, { method: "POST", body: form });
        const tg = await res.json().catch(() => ({}));
        if (!res.ok || !tg?.ok) throw new Error(`Telegram: ${tg?.description ?? res.status}`);
      };
      const dataZip = async (bid: string | null, label: string) => {
        const z = new JSZip();
        const mt: { key: string; count: number; cols: string[]; global?: boolean }[] = [];
        let total = 0;
        for (const t of ordered) {
          const rows = await selectRows(t, bid);
          mt.push({ key: t.key, count: rows.length, cols: t.cols, global: bid ? brandWhere(t.key, t.cols) === null : false });
          total += rows.length;
          z.file(`${t.key}.json`, JSON.stringify(rows));
        }
        const brandCounts: Record<string, number> = {};
        if (!bid) for (const b of brandList) {
          const [{ n }] = await sql`SELECT count(*)::int AS n FROM public.profiles WHERE branding_id = ${b.id}`;
          brandCounts[b.company_name] = n;
        }
        z.file("manifest.json", JSON.stringify({
          version: 2, created_at: created, scope: bid ? { branding_id: bid, company_name: label } : "all",
          brandings: brandList, profiles_per_brand: brandCounts, tables: mt, files: [],
        }, null, 2));
        return { bytes: await z.generateAsync({ type: "uint8array", compression: "DEFLATE" }), total };
      };
      try {
        const full = await dataZip(null, "Alle Marken");
        if (full.bytes.byteLength > MAX_PART) throw new Error("Daten-Backup größer als 45 MB – Telegram-Limit");
        await send(full.bytes, `backup-alle-${stamp}.zip`, `🗄 Komplett-Backup (alle Marken)\n${when}\n${ordered.length} Tabellen, ${full.total} Einträge`);
        for (const b of brandList) {
          const part = await dataZip(b.id, b.company_name);
          const slug = String(b.company_name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          await send(part.bytes, `backup-${slug}-${stamp}.zip`, `🏷️ ${b.company_name}\n🗄 Marken-Backup (nur Daten)\n${when}\n${part.total} Einträge`);
        }
        // files, split into parts
        const files = await listFiles(null);
        let z = new JSZip(), size = 0, partNo = 0, count = 0;
        const flush = async () => {
          if (!count) return;
          partNo++;
          const bytes = await z.generateAsync({ type: "uint8array", compression: "STORE" });
          await send(bytes, `dateien-${stamp}-${partNo}.zip`, `📎 Dateien Teil ${partNo}\n${when}\n${count} Dateien`);
          z = new JSZip(); size = 0; count = 0;
        };
        for (const f of files) {
          const { data } = await admin.storage.from(f.bucket).download(f.name);
          if (!data) continue;
          const buf = new Uint8Array(await data.arrayBuffer());
          if (buf.byteLength > MAX_PART) continue;
          if (size + buf.byteLength > MAX_PART) await flush();
          z.file(`files/${f.bucket}/${f.name}`, buf);
          size += buf.byteLength; count++;
        }
        await flush();
        await admin.from("app_settings").update({ backup_last_at: created, backup_last_error: null }).eq("id", true);
        return json({ ok: true, tables: ordered.length, rows: full.total, brands: brandList.length, files: files.length, file_parts: partNo });
      } catch (e) {
        return await fail((e as Error).message);
      }
    }

    return json({ error: "Unbekannte Aktion" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  } finally {
    await sql.end({ timeout: 2 });
  }
});
