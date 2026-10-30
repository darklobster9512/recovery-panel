import { useEffect, useState } from "react";
import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { fetchAppSettings, saveAppSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Download, Upload, Loader2, Send, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { importOrder } from "../../supabase/functions/_shared/backupScope";

type TableMeta = { key: string; count: number; cols?: string[]; global?: boolean };
type FileMeta = { bucket: string; name: string; size?: number };
type Manifest = {
  version: number; created_at: string; tables: TableMeta[];
  scope?: "all" | { branding_id: string; company_name: string };
  brandings?: { id: string; company_name: string }[];
  files?: FileMeta[];
};
type Report = { key: string; received: number; inserted: number; error?: string };
type Preview = { missingTables: string[]; removedCols: Record<string, string[]>; newCols: Record<string, string[]> };

async function call(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin-backup", { body });
  if (error) {
    let msg = error.message;
    try { msg = (await (error as any).context?.json())?.error ?? msg; } catch { /* */ }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

const fileName = (key: string) => `${key}.json`;

export default function AdminBackups() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [zip, setZip] = useState<JSZip | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [mode, setMode] = useState<"merge" | "overwrite">("merge");
  const [report, setReport] = useState<Report[] | null>(null);
  const [fileReport, setFileReport] = useState<{ ok: number; skipped: number; failed: number } | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [scopeSel, setScopeSel] = useState<string>("all");
  const [brandings, setBrandings] = useState<{ id: string; company_name: string }[]>([]);
  useEffect(() => { supabase.from("brandings").select("id, company_name").order("created_at").then(({ data }) => setBrandings(data ?? [])); }, []);

  const [chatId, setChatId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [lastAt, setLastAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const loadAuto = () => fetchAppSettings().then((s: any) => {
    setChatId(s.backup_telegram_chat_id ?? ""); setEnabled(!!s.backup_enabled);
    setLastAt(s.backup_last_at ?? null); setLastError(s.backup_last_error ?? null);
  }).catch(() => {});
  useEffect(() => { loadAuto(); }, []);

  const saveAuto = async () => {
    try {
      await saveAppSettings({ backup_telegram_chat_id: chatId.trim(), backup_enabled: enabled } as any);
      toast({ title: "Automatische Backups gespeichert" });
    } catch (e) { toast({ title: "Fehler", description: (e as Error).message, variant: "destructive" }); }
  };

  const sendNow = async () => {
    setSending(true);
    try {
      await saveAppSettings({ backup_telegram_chat_id: chatId.trim(), backup_enabled: enabled } as any);
      const r = await call({ action: "telegram" });
      toast({ title: "Backup an Telegram gesendet", description: `${r.tables} Tabellen, ${r.rows} Einträge, ${r.brands} Marken, ${r.files} Dateien` });
    } catch (e) { toast({ title: "Senden fehlgeschlagen", description: (e as Error).message, variant: "destructive" }); }
    finally { setSending(false); loadAuto(); }
  };

  const runExport = async () => {
    setBusy(true); setProgress(0); setReport(null); setFileReport(null);
    const bid = scopeSel === "all" ? undefined : scopeSel;
    const brand = brandings.find((x) => x.id === bid);
    try {
      setStatus("Tabellen werden ermittelt …");
      const { tables, brandings: bl } = await call({ action: "list", branding_id: bid });
      const { files } = await call({ action: "list_files", branding_id: bid });
      const total = (tables.reduce((s: number, t: any) => s + t.count, 0) + files.length) || 1;
      let done = 0;
      const z = new JSZip();
      for (const t of tables) {
        setStatus(`Sichere ${t.key} (${t.count})`);
        const all: unknown[] = [];
        for (let off = 0; off < t.count; off += 2000) {
          const { rows } = await call({ action: "export", table: t.key, offset: off, limit: 2000, branding_id: bid });
          all.push(...rows);
          done += rows.length;
          setProgress(Math.round((done / total) * 100));
          if (rows.length < 2000) break;
        }
        z.file(fileName(t.key), JSON.stringify(all));
      }
      const saved: FileMeta[] = [];
      for (const [i, f] of (files as FileMeta[]).entries()) {
        setStatus(`Sichere Dateien (${i + 1}/${files.length})`);
        try {
          const { url } = await call({ action: "file_url", bucket: f.bucket, path: f.name });
          const res = await fetch(url);
          if (res.ok) { z.file(`files/${f.bucket}/${f.name}`, await res.blob()); saved.push(f); }
        } catch { /* skip unreadable file */ }
        done++; setProgress(Math.round((done / total) * 100));
      }
      const m: Manifest = {
        version: 2, created_at: new Date().toISOString(), tables,
        scope: brand ? { branding_id: brand.id, company_name: brand.company_name } : "all",
        brandings: bl, files: saved,
      };
      z.file("manifest.json", JSON.stringify(m, null, 2));
      setStatus("ZIP wird erstellt …");
      const blob = await z.generateAsync({ type: "blob", compression: "DEFLATE" });
      const slug = brand ? brand.company_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "alle";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `backup-${slug}-${m.created_at.slice(0, 19).replace(/[:T]/g, "-")}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      setStatus(`Fertig: ${tables.length} Tabellen, ${done - saved.length} Einträge, ${saved.length} Dateien gesichert.`);
      setProgress(100);
    } catch (e) {
      toast({ title: "Backup fehlgeschlagen", description: (e as Error).message, variant: "destructive" });
      setStatus("");
    } finally { setBusy(false); }
  };

  const loadFile = async (f: File) => {
    try {
      const z = await JSZip.loadAsync(f);
      const mf = z.file("manifest.json");
      if (!mf) throw new Error("manifest.json fehlt – keine gültige Backup-Datei");
      const m: Manifest = JSON.parse(await mf.async("string"));
      setManifest(m); setZip(z); setReport(null); setFileReport(null);
      const { tables: cur } = await call({ action: "list" });
      const curMap = new Map<string, string[]>(cur.map((t: any) => [t.key, t.cols ?? []]));
      const pv: Preview = { missingTables: [], removedCols: {}, newCols: {} };
      for (const t of m.tables) {
        const now = curMap.get(t.key);
        if (!now) { pv.missingTables.push(t.key); continue; }
        if (!t.cols) continue;
        const rem = t.cols.filter((c) => !now.includes(c));
        const add = now.filter((c) => !t.cols!.includes(c));
        if (rem.length) pv.removedCols[t.key] = rem;
        if (add.length) pv.newCols[t.key] = add;
      }
      setPreview(pv);
    } catch (e) {
      toast({ title: "Datei ungültig", description: (e as Error).message, variant: "destructive" });
    }
  };

  const runImport = async () => {
    if (!zip || !manifest) return;
    if (!confirm(mode === "overwrite"
      ? "Bestehende Einträge mit gleicher ID werden überschrieben. Fortfahren?"
      : "Fehlende Einträge werden aus dem Backup ergänzt. Fortfahren?")) return;
    setBusy(true); setProgress(0); setFileReport(null);
    const isBrand = !!manifest.scope && manifest.scope !== "all";
    const rep: Report[] = [];
    const files = manifest.files ?? [];
    const byKey = new Map(manifest.tables.map((t) => [t.key, t]));
    const order = importOrder(manifest.tables.map((t) => t.key)).map((k) => byKey.get(k)!);
    const total = (manifest.tables.reduce((s, t) => s + t.count, 0) + files.length) || 1;
    let done = 0;
    for (const t of order) {
      const f = zip.file(fileName(t.key));
      const r: Report = { key: t.key, received: 0, inserted: 0 };
      const errs: string[] = [];
      // Brand import: global tables are only merged, never overwritten.
      const tMode = isBrand && t.global ? "merge" : mode;
      try {
        if (!f) throw new Error("Datei fehlt im Backup");
        const rows: unknown[] = JSON.parse(await f.async("string"));
        r.received = rows.length;
        for (let i = 0; i < rows.length; i += 500) {
          setStatus(`Stelle ${t.key} wieder her (${Math.min(i + 500, rows.length)}/${rows.length})`);
          try {
            const res = await call({ action: "import", table: t.key, rows: rows.slice(i, i + 500), mode: tMode });
            r.inserted += res.inserted ?? 0;
          } catch (e) { errs.push((e as Error).message); }
          done += Math.min(500, rows.length - i);
          setProgress(Math.round((done / total) * 100));
        }
      } catch (e) { errs.push((e as Error).message); }
      if (errs.length) r.error = [...new Set(errs)].join("; ");
      rep.push(r);
      setReport([...rep]);
    }
    const fr = { ok: 0, skipped: 0, failed: 0 };
    for (const [i, fm] of files.entries()) {
      setStatus(`Lade Dateien hoch (${i + 1}/${files.length})`);
      try {
        const entry = zip.file(`files/${fm.bucket}/${fm.name}`);
        if (!entry) throw new Error("fehlt");
        const res = await call({ action: "file_upload_url", bucket: fm.bucket, path: fm.name, mode });
        if (res.exists) fr.skipped++;
        else {
          const { error } = await supabase.storage.from(fm.bucket).uploadToSignedUrl(res.path, res.token, await entry.async("blob"));
          if (error) throw error;
          fr.ok++;
        }
      } catch { fr.failed++; }
      done++; setProgress(Math.round((done / total) * 100));
      setFileReport({ ...fr });
    }
    setStatus("Wiederherstellung abgeschlossen.");
    setProgress(100);
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Automatische Backups per Telegram</CardTitle>
          <CardDescription>Stündlich werden ein Komplett-Backup, je ein Backup pro Marke und alle Dateien (in Teilen) an diesen Telegram-Chat geschickt. Der Chat sollte privat sein – das Backup enthält Zugangsdaten.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5 max-w-sm">
            <Label>Telegram Chat-ID</Label>
            <Input value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="-1001234567890" />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={enabled} onCheckedChange={setEnabled} id="bk-en" />
            <Label htmlFor="bk-en">Stündliche Backups aktiv</Label>
          </div>
          <div className="text-sm text-muted-foreground">
            Letztes Backup: {lastAt ? new Date(lastAt).toLocaleString("de-DE") : "noch keins"}
            {lastError && <div className="text-destructive">Letzter Fehler: {lastError}</div>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={saveAuto} className="gap-2"><Save className="h-4 w-4" />Speichern</Button>
            <Button onClick={sendNow} disabled={sending || !chatId.trim()} variant="secondary" className="gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Backup jetzt senden
            </Button>
          </div>
        </CardContent>
      </Card>

      {(busy || status) && (
        <Card><CardContent className="pt-6 space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground flex items-center gap-2">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{status}</p>
        </CardContent></Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Backup erstellen</CardTitle>
          <CardDescription>Lädt eine ZIP-Datei mit allen Tabellen und Dateien herunter – für alle Marken oder nur eine Marke.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Select value={scopeSel} onValueChange={setScopeSel}>
            <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Marken</SelectItem>
              {brandings.map((b) => <SelectItem key={b.id} value={b.id}>{b.company_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={runExport} disabled={busy}><Download className="h-4 w-4 mr-2" />Backup erstellen</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup wiederherstellen</CardTitle>
          <CardDescription>Beim Wiederherstellen werden keine E-Mails, SMS oder Telegram-Nachrichten verschickt.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input type="file" accept=".zip" disabled={busy}
            onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
            className="text-sm" />
          {manifest && (
            <>
              <div className="text-sm">
                Backup vom <b>{new Date(manifest.created_at).toLocaleString("de-DE")}</b> – {manifest.tables.length} Tabellen,{" "}
                {manifest.tables.reduce((s, t) => s + t.count, 0)} Einträge, {manifest.files?.length ?? 0} Dateien
                <div className="text-muted-foreground">
                  Umfang: {!manifest.scope || manifest.scope === "all" ? "Alle Marken" : `Nur ${manifest.scope.company_name}`}
                  {manifest.brandings?.length ? ` · Marken: ${manifest.brandings.map((b) => b.company_name).join(", ")}` : ""}
                  {manifest.version < 2 && " · Älteres Backup ohne Dateien"}
                </div>
                {preview && (preview.missingTables.length > 0 || Object.keys(preview.removedCols).length > 0 || Object.keys(preview.newCols).length > 0) && (
                  <div className="mt-2 rounded-lg border border-warning/40 bg-warning/10 p-2 text-xs space-y-1">
                    {preview.missingTables.length > 0 && <div>Tabellen gibt es nicht mehr (werden übersprungen): {preview.missingTables.join(", ")}</div>}
                    {Object.entries(preview.removedCols).map(([k, c]) => <div key={k}>{k}: Felder gibt es nicht mehr (ignoriert): {c.join(", ")}</div>)}
                    {Object.entries(preview.newCols).map(([k, c]) => <div key={"n" + k}>{k}: neue Felder bekommen Standardwerte: {c.join(", ")}</div>)}
                  </div>
                )}
              </div>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)} className="space-y-1">
                <div className="flex items-center gap-2"><RadioGroupItem value="merge" id="m1" /><Label htmlFor="m1">Ergänzen – nur fehlende Einträge einfügen</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="overwrite" id="m2" /><Label htmlFor="m2">Überschreiben – Einträge mit gleicher ID ersetzen</Label></div>
              </RadioGroup>
              <Button onClick={runImport} disabled={busy} variant="secondary"><Upload className="h-4 w-4 mr-2" />Wiederherstellen</Button>
            </>
          )}
          {fileReport && (
            <div className="text-sm">Dateien: {fileReport.ok} hochgeladen, {fileReport.skipped} schon vorhanden, {fileReport.failed} fehlgeschlagen</div>
          )}
          {report && (
            <div className="border rounded-lg divide-y text-sm max-h-96 overflow-auto">
              {report.map((r) => (
                <div key={r.key} className="flex justify-between px-3 py-1.5">
                  <span className="font-mono">{r.key}</span>
                  {r.error ? <span className="text-destructive">{r.error}</span>
                    : <span className="text-muted-foreground">{r.inserted} eingefügt / {r.received - r.inserted} übersprungen</span>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
