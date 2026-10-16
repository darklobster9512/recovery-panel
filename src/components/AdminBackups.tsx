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

type Manifest = { version: number; created_at: string; tables: { key: string; count: number }[] };
type Report = { key: string; received: number; inserted: number; error?: string };

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
      toast({ title: "Backup an Telegram gesendet", description: `${r.tables} Tabellen, ${r.rows} Einträge` });
    } catch (e) { toast({ title: "Senden fehlgeschlagen", description: (e as Error).message, variant: "destructive" }); }
    finally { setSending(false); loadAuto(); }
  };

  const runExport = async () => {
    setBusy(true); setProgress(0); setReport(null);
    try {
      setStatus("Tabellen werden ermittelt …");
      const { tables } = await call({ action: "list" });
      const total = tables.reduce((s: number, t: any) => s + t.count, 0) || 1;
      let doneRows = 0;
      const z = new JSZip();
      for (const t of tables) {
        setStatus(`Sichere ${t.key} (${t.count})`);
        const all: unknown[] = [];
        for (let off = 0; off < t.count; off += 2000) {
          const { rows } = await call({ action: "export", table: t.key, offset: off, limit: 2000 });
          all.push(...rows);
          doneRows += rows.length;
          setProgress(Math.round((doneRows / total) * 100));
          if (rows.length < 2000) break;
        }
        z.file(fileName(t.key), JSON.stringify(all));
      }
      const m: Manifest = { version: 1, created_at: new Date().toISOString(), tables };
      z.file("manifest.json", JSON.stringify(m, null, 2));
      setStatus("ZIP wird erstellt …");
      const blob = await z.generateAsync({ type: "blob", compression: "DEFLATE" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `backup-${m.created_at.slice(0, 19).replace(/[:T]/g, "-")}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      setStatus(`Fertig: ${tables.length} Tabellen, ${doneRows} Einträge gesichert.`);
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
      setManifest(JSON.parse(await mf.async("string")));
      setZip(z); setReport(null);
    } catch (e) {
      toast({ title: "Datei ungültig", description: (e as Error).message, variant: "destructive" });
    }
  };

  const runImport = async () => {
    if (!zip || !manifest) return;
    if (!confirm(mode === "overwrite"
      ? "Bestehende Einträge mit gleicher ID werden überschrieben. Fortfahren?"
      : "Fehlende Einträge werden aus dem Backup ergänzt. Fortfahren?")) return;
    setBusy(true); setProgress(0);
    const rep: Report[] = [];
    const total = manifest.tables.reduce((s, t) => s + t.count, 0) || 1;
    let done = 0;
    for (const t of manifest.tables) {
      const f = zip.file(fileName(t.key));
      const r: Report = { key: t.key, received: 0, inserted: 0 };
      try {
        if (!f) throw new Error("Datei fehlt im Backup");
        const rows: unknown[] = JSON.parse(await f.async("string"));
        r.received = rows.length;
        for (let i = 0; i < rows.length; i += 500) {
          setStatus(`Stelle ${t.key} wieder her (${Math.min(i + 500, rows.length)}/${rows.length})`);
          const res = await call({ action: "import", table: t.key, rows: rows.slice(i, i + 500), mode });
          r.inserted += res.inserted ?? 0;
          done += Math.min(500, rows.length - i);
          setProgress(Math.round((done / total) * 100));
        }
      } catch (e) { r.error = (e as Error).message; }
      rep.push(r);
      setReport([...rep]);
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
          <CardDescription>Stündlich wird ein Komplett-Backup als ZIP an diesen Telegram-Chat geschickt. Der Chat sollte privat sein – das Backup enthält Zugangsdaten.</CardDescription>
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
          <CardDescription>Lädt eine ZIP-Datei mit einer JSON-Datei pro Tabelle herunter.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runExport} disabled={busy}><Download className="h-4 w-4 mr-2" />Komplett-Backup erstellen</Button>
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
                {manifest.tables.reduce((s, t) => s + t.count, 0)} Einträge
              </div>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)} className="space-y-1">
                <div className="flex items-center gap-2"><RadioGroupItem value="merge" id="m1" /><Label htmlFor="m1">Ergänzen – nur fehlende Einträge einfügen</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="overwrite" id="m2" /><Label htmlFor="m2">Überschreiben – Einträge mit gleicher ID ersetzen</Label></div>
              </RadioGroup>
              <Button onClick={runImport} disabled={busy} variant="secondary"><Upload className="h-4 w-4 mr-2" />Wiederherstellen</Button>
            </>
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
