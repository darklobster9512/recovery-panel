import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileSpreadsheet, Loader2, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { parseLeadsFile, type ParseResult, formatEur, truncate } from "@/lib/leads";
import { DialogShellHeader, DialogSection, DialogFooterBar } from "@/components/admin/DialogShell";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

export default function LeadImportDialog({ open, onOpenChange, onImported }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [result, setResult] = useState<ParseResult | null>(null);

  const reset = () => {
    setResult(null);
    setFileName(null);
    setFileSize(null);
    setParsing(false);
    setImporting(false);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setParsing(true);
    setFileName(file.name);
    setFileSize(file.size);
    try {
      const parsed = await parseLeadsFile(file);
      setResult(parsed);
      if (parsed.leads.length === 0) {
        toast({ title: "Keine Datensätze gefunden", variant: "destructive" });
      }
    } catch (e) {
      toast({
        title: "Datei konnte nicht gelesen werden",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
      setResult(null);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!result || result.leads.length === 0) return;
    setImporting(true);

    // 1. In-file dedup nach normalisierter E-Mail
    const seen = new Set<string>();
    let dupInFile = 0;
    const uniqueLeads = result.leads.filter((l) => {
      const key = l.email?.trim().toLowerCase();
      if (!key) return true;
      if (seen.has(key)) {
        dupInFile++;
        return false;
      }
      seen.add(key);
      return true;
    });

    // 2. Bereits vorhandene E-Mails in DB abfragen
    const emails = Array.from(seen);
    let existing = new Set<string>();
    if (emails.length > 0) {
      const { data: existingRows, error: selErr } = await supabase
        .from("leads")
        .select("email")
        .in("email", emails);
      if (selErr) {
        setImporting(false);
        toast({ title: "Duplikat-Prüfung fehlgeschlagen", description: selErr.message, variant: "destructive" });
        return;
      }
      existing = new Set(
        (existingRows ?? [])
          .map((r) => r.email?.trim().toLowerCase())
          .filter((e): e is string => !!e),
      );
    }

    const toInsert = uniqueLeads.filter((l) => {
      const key = l.email?.trim().toLowerCase();
      return !key || !existing.has(key);
    });
    const dupInDb = uniqueLeads.length - toInsert.length;

    if (toInsert.length === 0) {
      setImporting(false);
      toast({
        title: "Keine neuen Leads",
        description: `Alle ${result.leads.length} Einträge sind Duplikate (${dupInDb} bereits vorhanden, ${dupInFile} in der Datei).`,
      });
      return;
    }

    const rows = toInsert.map((l) => ({
      full_name: l.full_name,
      email: l.email,
      phone_number: l.phone_number,
      schadenshoehe: l.schadenshoehe,
      vorfall: l.vorfall,
      external_id: l.external_id,
      campaign: l.campaign,
      raw: l.raw,
      source: "csv",
      imported_by: user?.id ?? null,
    }));

    const { data, error } = await supabase
      .from("leads")
      .upsert(rows, { onConflict: "external_id", ignoreDuplicates: true })
      .select("id, full_name, email, phone_number, vorfall");

    if (error) {
      setImporting(false);
      toast({ title: "Import fehlgeschlagen", description: error.message, variant: "destructive" });
      return;
    }
    const insertedRows = data ?? [];
    const inserted = insertedRows.length;
    const skipped = dupInDb + dupInFile + (toInsert.length - inserted);

    // Auto-create Vic accounts for each newly imported lead
    const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
    const genPw = () => {
      const buf = new Uint32Array(8);
      crypto.getRandomValues(buf);
      let out = "";
      for (let i = 0; i < 8; i++) out += CHARS[buf[i] % CHARS.length];
      return out;
    };

    let accountsCreated = 0;
    const failedAccounts: string[] = [];
    for (const row of insertedRows as any[]) {
      if (!row.email) {
        failedAccounts.push(`${row.full_name ?? "?"} (keine E-Mail)`);
        continue;
      }
      const fullName = (row.full_name || "").trim();
      const parts = fullName.split(/\s+/);
      const firstName = parts.slice(0, -1).join(" ") || fullName || "Vic";
      const lastName = parts.length > 1 ? parts[parts.length - 1] : "";
      try {
        const res = await supabase.functions.invoke("create-user", {
          body: {
            email: row.email,
            first_name: firstName,
            last_name: lastName || "—",
            phone: row.phone_number || null,
            password: genPw(),
            source_lead_id: row.id,
            source_lead_id: row.id,
            role: "user",
          },
        });
        const result: any = res.data;
        if (res.error || result?.error) {
          failedAccounts.push(`${row.email} (${res.error?.message ?? result?.error})`);
        } else {
          accountsCreated++;
        }
      } catch (e: any) {
        failedAccounts.push(`${row.email} (${e.message ?? String(e)})`);
      }
    }

    setImporting(false);
    toast({
      title: "Import abgeschlossen",
      description:
        `${inserted} neue Leads importiert, ${accountsCreated} Nutzerkonten erstellt` +
        (skipped > 0 ? `, ${skipped} Duplikate übersprungen` : "") +
        (failedAccounts.length > 0 ? `. Konto-Fehler: ${failedAccounts.slice(0, 3).join("; ")}${failedAccounts.length > 3 ? " …" : ""}` : "") +
        ".",
      variant: failedAccounts.length > 0 ? "destructive" : undefined,
    });
    reset();
    onOpenChange(false);
    onImported();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 gap-0">
        <DialogHeader className="space-y-0">
          <DialogShellHeader
            icon={<Upload className="w-5 h-5" />}
            eyebrow="CSV-Import"
            title={<DialogTitle asChild><span>Leads importieren</span></DialogTitle>}
            description="CSV oder TSV. Tabulator, Semikolon und Komma werden automatisch erkannt, ebenso UTF-8 und UTF-16."
          />
        </DialogHeader>

        <div className="space-y-6 py-6">
          <DialogSection label="Datei">
            <label
              htmlFor="lead-csv"
              className="block cursor-pointer rounded-md border border-dashed border-border bg-muted/30 p-6 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-11 h-11 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium">
                  {fileName ? "Andere Datei wählen" : "Datei auswählen oder hierher ziehen"}
                </p>
                <p className="text-xs text-muted-foreground">.csv · .tsv · .txt</p>
              </div>
              <Input
                id="lead-csv"
                type="file"
                accept=".csv,.tsv,.txt,text/csv"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>
            {fileName && (
              <div className="mt-3 flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5">
                <FileSpreadsheet className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileName}</p>
                  {fileSize != null && (
                    <p className="text-xs text-muted-foreground">{(fileSize / 1024).toFixed(1)} KB</p>
                  )}
                </div>
                {parsing && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                {result && !parsing && <CheckCircle2 className="w-4 h-4 text-success" />}
              </div>
            )}
          </DialogSection>

          {result && result.leads.length > 0 && (
            <>
              <DialogSection label="Feld-Zuordnung" hint={`${result.leads.length} Datensätze`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md border border-border bg-muted/30 p-3">
                  {Object.entries(result.mapping).map(([field, col]) => (
                    <div key={field} className="flex justify-between items-center gap-2 text-xs px-2 py-1.5 rounded bg-card">
                      <span className="text-muted-foreground font-medium">{field}</span>
                      {col ? (
                        <span className="font-mono text-foreground truncate">{col}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-destructive font-medium">
                          <AlertCircle className="w-3 h-3" /> fehlt
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </DialogSection>

              <DialogSection label="Vorschau" hint="Erste 3 Zeilen">
                <div className="rounded-md border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold">Name</th>
                        <th className="text-left px-3 py-2 font-semibold">Email</th>
                        <th className="text-left px-3 py-2 font-semibold">Telefon</th>
                        <th className="text-left px-3 py-2 font-semibold">Schaden</th>
                        <th className="text-left px-3 py-2 font-semibold">Vorfall</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.leads.slice(0, 3).map((l, i) => (
                        <tr key={i} className="border-t border-border/40 bg-card">
                          <td className="px-3 py-2 font-medium">{l.full_name ?? "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{l.email ?? "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground tabular-nums">{l.phone_number ?? "—"}</td>
                          <td className="px-3 py-2 tabular-nums">{formatEur(l.schadenshoehe)}</td>
                          <td className="px-3 py-2 text-muted-foreground">{truncate(l.vorfall, 30)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DialogSection>
            </>
          )}
        </div>

        <DialogFooterBar>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            Abbrechen
          </Button>
          <Button
            onClick={handleImport}
            disabled={!result || result.leads.length === 0 || importing}
            className="gap-2 min-w-[160px]"
          >
            {importing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Importiert…</>
            ) : (
              <><Upload className="w-4 h-4" /> {result ? `${result.leads.length} Leads importieren` : "Importieren"}</>
            )}
          </Button>
        </DialogFooterBar>
      </DialogContent>
    </Dialog>
  );
}
