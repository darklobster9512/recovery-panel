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
import { ArrowLeft, Loader2 } from "lucide-react";
import LeadNotesPanel from "@/components/LeadNotesPanel";
import LeadActivityLog from "@/components/LeadActivityLog";
import {
  formatDateTime,
  formatEur,
  LEAD_STATUSES,
  statusMeta,
  type Lead,
  type LeadStatus,
} from "@/lib/leads";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-right break-all">{value}</span>
    </div>
  );
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
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Lädt…
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Lead nicht gefunden.</p>
        <Button variant="outline" onClick={() => navigate("/admin/leads")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/leads")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
        </Button>
        <Badge variant="secondary" className={statusMeta(lead.status).className}>
          {statusMeta(lead.status).label}
        </Badge>
        <div className="flex-1" />
        <Select value={lead.status} onValueChange={(v) => changeStatus(v as LeadStatus)}>
          <SelectTrigger className="w-48">
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Kontakt</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Voller Name" value={lead.full_name ?? "—"} />
            <Row label="Email" value={lead.email ?? "—"} />
            <Row label="Telefonnummer" value={lead.phone_number ?? "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
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
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Fall</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row label="Schadenshöhe" value={formatEur(lead.schadenshoehe)} />
          <div>
            <p className="text-sm text-gray-500 mb-1">Was ist vorgefallen?</p>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{lead.vorfall ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      {lead.raw && Object.keys(lead.raw).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Rohdaten</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setRawOpen((o) => !o)}>
                {rawOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          {rawOpen && (
            <CardContent>
              {Object.entries(lead.raw).map(([k, v]) => (
                <Row key={k} label={k} value={String(v)} />
              ))}
            </CardContent>
          )}
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
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
