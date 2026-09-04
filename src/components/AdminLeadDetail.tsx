import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import LeadNotesPanel from "@/components/LeadNotesPanel";
import LeadActivityLog from "@/components/LeadActivityLog";
import AssignCallerSelect from "@/components/AssignCallerSelect";
import { useAuth } from "@/hooks/useAuth";
import {
  CAMPAIGN_META,
  formatDateTime,
  formatEur,
  LEAD_STATUSES,
  statusMeta,
  type Lead,
  type LeadStatus,
} from "@/lib/leads";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-border/60 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right break-all">{value}</span>
    </div>
  );
}

function AdminOnlyCallerSelect({ leadId, value, onChange }: { leadId: string; value: string | null; onChange: (v: string | null) => void }) {
  const { role } = useAuth();
  if (role !== "admin") return null;
  return <AssignCallerSelect target="lead" targetId={leadId} value={value} onChange={onChange} />;
}

export default function AdminLeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
    if (error) {
      toast({ title: "Lead nicht geladen", description: error.message, variant: "destructive" });
    } else {
      setLead((data as Lead) ?? null);
    }
    setLoading(false);
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (status: LeadStatus) => {
    if (!lead) return;
    setLead({ ...lead, status });
    const { error } = await supabase.from("leads").update({ status }).eq("id", lead.id);
    if (error) {
      toast({ title: "Status nicht geändert", description: error.message, variant: "destructive" });
      load();
      return;
    }
    setRefreshKey((k) => k + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Lädt…
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Lead nicht gefunden.</p>
        <Button variant="outline" onClick={() => navigate("/admin/leads")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/leads")} className="mb-3 -ml-3">
            <ArrowLeft className="w-4 h-4 mr-2" /> Zurück zu Leads
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-2xl font-semibold">{lead.full_name ?? "Lead ohne Namen"}</h2>
            {lead.campaign && (
              <Badge variant="secondary" className={CAMPAIGN_META[lead.campaign].className}>
                {CAMPAIGN_META[lead.campaign].label}
              </Badge>
            )}
            <Badge variant="secondary" className={statusMeta(lead.status).className}>
              {statusMeta(lead.status).label}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Kontaktinformationen, Falldaten und Bearbeitungsverlauf.</p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <Button onClick={() => navigate(`/admin/vics?newFromLead=${lead.id}`)} className="gap-2">
            <UserPlus className="w-4 h-4" /> Nutzerkonto erstellen
          </Button>
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase text-muted-foreground">Bearbeitungsstatus</span>
            <Select value={lead.status} onValueChange={(v) => changeStatus(v as LeadStatus)}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AdminOnlyCallerSelect leadId={lead.id} value={(lead as any).assigned_caller_id ?? null} onChange={(v) => setLead({ ...lead, ...(v !== undefined ? { assigned_caller_id: v } : {}) } as any)} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-border px-5 py-4">
            <CardTitle className="text-base">Kontakt</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Voller Name" value={lead.full_name ?? "—"} />
            <Row label="Email" value={lead.email ?? "—"} />
            <Row label="Telefonnummer" value={lead.phone_number ?? "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border px-5 py-4">
            <CardTitle className="text-base">Import</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Importiert am" value={formatDateTime(lead.imported_at)} />
            <Row label="Quelle" value={lead.source} />
            <Row label="Externe ID" value={lead.external_id ?? "—"} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-border px-5 py-4">
          <CardTitle className="text-base">Fall</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row label="Schadenshöhe" value={formatEur(lead.schadenshoehe)} />
          <div>
            <p className="text-sm text-muted-foreground mb-1">Was ist vorgefallen?</p>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{lead.vorfall ?? "—"}</p>
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader className="border-b border-border px-5 py-4">
          <CardTitle className="text-base">Notizen</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadNotesPanel leadId={lead.id} onSaved={() => setRefreshKey((k) => k + 1)} />
        </CardContent>
      </Card>

      <LeadActivityLog leadId={lead.id} refreshKey={refreshKey} title="Verlauf dieses Leads" />
    </div>
  );
}
