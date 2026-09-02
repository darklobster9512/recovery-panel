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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Upload } from "lucide-react";
import { parseLeadsFile, type ParseResult, formatEur, truncate } from "@/lib/leads";

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
  const [result, setResult] = useState<ParseResult | null>(null);

  const reset = () => {
    setResult(null);
    setFileName(null);
    setParsing(false);
    setImporting(false);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setParsing(true);
    setFileName(file.name);
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
    const rows = result.leads.map((l) => ({
      ...l,
      source: "csv",
      imported_by: user?.id ?? null,
    }));

    const { data, error } = await supabase
      .from("leads")
      .upsert(rows, { onConflict: "external_id", ignoreDuplicates: true })
      .select("id");

    setImporting(false);
    if (error) {
      toast({ title: "Import fehlgeschlagen", description: error.message, variant: "destructive" });
      return;
    }
    const inserted = data?.length ?? 0;
    toast({
      title: "Import abgeschlossen",
      description: `${inserted} neue Leads importiert${
        result.leads.length - inserted > 0 ? `, ${result.leads.length - inserted} Duplikate übersprungen` : ""
      }.`,
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Leads importieren</DialogTitle>
          <DialogDescription>
            CSV- oder TSV-Datei hochladen. Tabulator, Semikolon und Komma werden erkannt, ebenso
            UTF-8 und UTF-16.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead-csv">Datei</Label>
            <Input
              id="lead-csv"
              type="file"
              accept=".csv,.tsv,.txt,text/csv"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {fileName && <p className="text-xs text-gray-500">{fileName}</p>}
          </div>

          {parsing && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Datei wird gelesen…
            </div>
          )}

          {result && result.leads.length > 0 && (
            <div className="space-y-3">
              <div className="rounded-lg border border-gray-200 p-3 text-sm">
                <p className="font-medium mb-2">
                  {result.leads.length} Datensätze erkannt
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                  {Object.entries(result.mapping).map(([field, col]) => (
                    <div key={field} className="flex justify-between gap-2">
                      <span className="text-gray-500">{field}</span>
                      <span className={col ? "font-medium" : "text-red-600"}>
                        {col ?? "nicht gefunden"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="text-left px-3 py-2">Name</th>
                      <th className="text-left px-3 py-2">Email</th>
                      <th className="text-left px-3 py-2">Telefon</th>
                      <th className="text-left px-3 py-2">Schaden</th>
                      <th className="text-left px-3 py-2">Vorfall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.leads.slice(0, 3).map((l, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-2">{l.full_name ?? "—"}</td>
                        <td className="px-3 py-2">{l.email ?? "—"}</td>
                        <td className="px-3 py-2">{l.phone_number ?? "—"}</td>
                        <td className="px-3 py-2">{formatEur(l.schadenshoehe)}</td>
                        <td className="px-3 py-2">{truncate(l.vorfall, 30)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            Abbrechen
          </Button>
          <Button onClick={handleImport} disabled={!result || result.leads.length === 0 || importing}>
            {importing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {result ? `${result.leads.length} Leads importieren` : "Importieren"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
