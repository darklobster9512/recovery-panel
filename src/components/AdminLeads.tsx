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
import { Eye, Loader2, MessageSquare, Upload } from "lucide-react";
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
      <div className="flex flex-wrap items-center gap-3">
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
        <Button onClick={() => setImportOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Leads importieren
        </Button>
      </div>

      <LeadActivityLog refreshKey={refreshKey} />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 p-6">
              <Loader2 className="w-4 h-4 animate-spin" /> Lädt…
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-500 p-6">
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
                  <TableHead className="w-24 text-right sticky right-0 bg-white">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="whitespace-nowrap text-gray-500 tabular-nums">
                      {formatDateTime(lead.imported_at)}
                    </TableCell>
                    <TableCell className="font-medium">{lead.full_name ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {lead.phone_number ? (
                        <button
                          onClick={() => copyValue(lead.phone_number!, "Telefonnummer")}
                          title="Klicken zum Kopieren"
                          className="hover:text-[hsl(221,100%,50%)] hover:underline"
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
                          className="hover:text-[hsl(221,100%,50%)] hover:underline"
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
                          className="text-left hover:text-[hsl(221,100%,50%)] hover:underline"
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
                        <SelectTrigger className="h-8 w-full border-0 bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:hidden">
                          <Badge
                            variant="secondary"
                            className={`w-full justify-center ${statusMeta(lead.status).className}`}
                          >
                            {statusMeta(lead.status).label}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value} className="pl-2 [&>span:first-child]:hidden">
                              <Badge variant="secondary" className={`w-full justify-center ${s.className}`}>
                                {s.label}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap sticky right-0 bg-white">
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Was ist vorgefallen?</DialogTitle>
            <DialogDescription>{vorfallLead?.full_name ?? "Lead"}</DialogDescription>
          </DialogHeader>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{vorfallLead?.vorfall}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
