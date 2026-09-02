import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Loader2, MessageSquare, Upload, FileText } from "lucide-react";
import { DialogShellHeader } from "@/components/admin/DialogShell";
import LeadImportDialog from "@/components/LeadImportDialog";
import LeadNotesDialog from "@/components/LeadNotesDialog";
import LeadActivityLog from "@/components/LeadActivityLog";
import {
  formatDateTime,
  formatEur,
  LEAD_STATUSES,
  statusMeta,
  truncate,
  type Lead,
  type LeadStatus,
} from "@/lib/leads";

export default function AdminLeads() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("alle");
  const [importOpen, setImportOpen] = useState(false);
  const [notesLead, setNotesLead] = useState<Lead | null>(null);
  const [vorfallLead, setVorfallLead] = useState<Lead | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("imported_at", { ascending: false });
    if (error) {
      toast({ title: "Leads konnten nicht geladen werden", description: error.message, variant: "destructive" });
    } else {
      setLeads((data ?? []) as Lead[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const bump = () => setRefreshKey((k) => k + 1);

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} kopiert`, description: value });
    } catch {
      toast({ title: "Kopieren fehlgeschlagen", variant: "destructive" });
    }
  };

  const changeStatus = async (lead: Lead, status: LeadStatus) => {
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status } : l)));
    const { error } = await supabase.from("leads").update({ status }).eq("id", lead.id);
    if (error) {
      toast({ title: "Status nicht geändert", description: error.message, variant: "destructive" });
      load();
      return;
    }
    bump();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== "alle" && l.status !== statusFilter) return false;
      if (!q) return true;
      return [l.full_name, l.email, l.phone_number, l.vorfall]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [leads, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-primary" style={{ letterSpacing: "0.08em" }}>Vertriebspipeline</p>
          <h2 className="font-display text-2xl font-semibold">Leads</h2>
          <p className="mt-2 text-sm text-muted-foreground">Importierte Kontakte prüfen, qualifizieren und weiterbearbeiten.</p>
        </div>
        <Button onClick={() => setImportOpen(true)}>
          <Upload className="w-4 h-4" />
          Leads importieren
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-card">
        <Input
          placeholder="Suche nach Name, Email, Telefon…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle Status</SelectItem>
            {LEAD_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <span className="text-xs font-semibold text-muted-foreground">{filtered.length} von {leads.length} Einträgen</span>
      </div>

      <LeadActivityLog refreshKey={refreshKey} />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-6">
              <Loader2 className="w-4 h-4 animate-spin" /> Lädt…
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6">
              {leads.length === 0 ? "Noch keine Leads importiert." : "Keine Treffer."}
            </p>
          ) : (
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36">Importiert am</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-40">Telefonnummer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-32">Schadenshöhe</TableHead>
                  <TableHead className="min-w-[240px]">Was ist vorgefallen?</TableHead>
                  <TableHead className="w-44">Status</TableHead>
                  <TableHead className="w-24 text-right sticky right-0 bg-card">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">
                      {formatDateTime(lead.imported_at)}
                    </TableCell>
                    <TableCell className="font-medium">{lead.full_name ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {lead.phone_number ? (
                        <button
                          onClick={() => copyValue(lead.phone_number!, "Telefonnummer")}
                          title="Klicken zum Kopieren"
                            className="hover:text-primary hover:underline"
                        >
                          {lead.phone_number}
                        </button>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.email ? (
                        <button
                          onClick={() => copyValue(lead.email!, "Email")}
                          title="Klicken zum Kopieren"
                          className="hover:text-primary hover:underline"
                        >
                          {lead.email}
                        </button>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {formatEur(lead.schadenshoehe)}
                    </TableCell>
                    <TableCell>
                      {lead.vorfall ? (
                        <button
                          onClick={() => setVorfallLead(lead)}
                          className="text-left hover:text-primary hover:underline"
                        >
                          {truncate(lead.vorfall, 60)}
                        </button>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={lead.status}
                        onValueChange={(v) => changeStatus(lead, v as LeadStatus)}
                      >
                        <SelectTrigger className="h-8 w-full border-0 bg-transparent p-0 pr-1 shadow-none focus:ring-0 flex items-center gap-1 cursor-pointer hover:bg-muted/60 rounded-md">
                          <Badge
                            variant="secondary"
                            className={`flex-1 justify-center ${statusMeta(lead.status).className}`}
                          >
                            {statusMeta(lead.status).label}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_STATUSES.map((s) => (
                            <SelectItem
                              key={s.value}
                              value={s.value}
                              className="pl-2 [&>span:first-child]:hidden [&>span]:w-full"
                            >
                              <Badge variant="secondary" className={`w-full justify-center ${s.className}`}>
                                {s.label}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap sticky right-0 bg-card">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Notizen"
                        onClick={() => setNotesLead(lead)}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Details"
                        onClick={() => navigate(`/admin/leads/${lead.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <LeadImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => {
          load();
          bump();
        }}
      />

      <LeadNotesDialog
        leadId={notesLead?.id ?? null}
        leadName={notesLead?.full_name ?? null}
        onClose={() => setNotesLead(null)}
        onSaved={bump}
      />

      <Dialog open={!!vorfallLead} onOpenChange={(o) => !o && setVorfallLead(null)}>
        <DialogContent className="max-w-lg p-6 gap-0">
          <DialogHeader className="space-y-0">
            <DialogShellHeader
              icon={<FileText className="w-5 h-5" />}
              eyebrow="Vorfallbeschreibung"
              title={<DialogTitle asChild><span>{vorfallLead?.full_name ?? "Lead"}</span></DialogTitle>}
              description="Vom Lead übermittelte Schilderung des Vorfalls."
            />
          </DialogHeader>
          <div className="pt-6">
            <div className="rounded-md border border-border bg-muted/45 p-4">
              <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">{vorfallLead?.vorfall}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
