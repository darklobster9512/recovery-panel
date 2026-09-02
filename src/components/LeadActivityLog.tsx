import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, History, Loader2 } from "lucide-react";
import { activityLabel, formatDateTime, type LeadActivity } from "@/lib/leads";

interface Props {
  /** When set, only activity of this lead is shown and the log is always expanded. */
  leadId?: string;
  limit?: number;
  refreshKey?: number;
  title?: string;
  defaultOpen?: boolean;
}

export default function LeadActivityLog({
  leadId,
  limit = 50,
  refreshKey = 0,
  title = "Aktivitätsprotokoll",
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen || !!leadId);
  const [items, setItems] = useState<LeadActivity[]>([]);
  const [actors, setActors] = useState<Record<string, string>>({});
  const [leadNames, setLeadNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let query = supabase
      .from("lead_activity")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (leadId) query = query.eq("lead_id", leadId);

    const { data, error } = await query;
    if (error) {
      setLoading(false);
      return;
    }
    const list = (data ?? []) as LeadActivity[];
    setItems(list);

    const actorIds = [...new Set(list.map((a) => a.actor_id).filter(Boolean))] as string[];
    if (actorIds.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("id, email").in("id", actorIds);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p: { id: string; email: string | null }) => {
        map[p.id] = p.email ?? "Unbekannt";
      });
      setActors(map);
    }

    if (!leadId) {
      const ids = [...new Set(list.map((a) => a.lead_id))];
      if (ids.length > 0) {
        const { data: leads } = await supabase.from("leads").select("id, full_name").in("id", ids);
        const map: Record<string, string> = {};
        (leads ?? []).forEach((l: { id: string; full_name: string | null }) => {
          map[l.id] = l.full_name ?? "Ohne Namen";
        });
        setLeadNames(map);
      }
    }
    setLoading(false);
  }, [leadId, limit]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    load();
  }, [load, open, refreshKey]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            {title}
          </CardTitle>
          {!leadId && (
            <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
              {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Lädt…
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Aktivität.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {items.map((a) => (
                <li key={a.id} className="text-sm flex flex-wrap gap-x-2 border-b border-border/60 pb-2 last:border-0">
                  <span className="text-muted-foreground tabular-nums">{formatDateTime(a.created_at)}</span>
                  <span className="text-foreground/75">
                    {(a.actor_id ? actors[a.actor_id] : null) ?? "System"}
                  </span>
                  {!leadId && (
                    <span className="font-medium text-foreground">{leadNames[a.lead_id] ?? "—"}</span>
                  )}
                  <span className="text-foreground/80">{activityLabel(a)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      )}
    </Card>
  );
}
