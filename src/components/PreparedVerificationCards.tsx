import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import VerificationLogo from "@/components/VerificationLogo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, Clock, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { splitVerificationTitle } from "@/lib/verificationRequests";

interface Item {
  id: string; request_id: string; vic_id: string; auftrag_key: string; verification_id: string | null;
  status: string; created_at: string;
}

export default function PreparedVerificationCards({ vicIds, onChanged }: { vicIds: Set<string> | null; onChanged?: () => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [verifs, setVerifs] = useState<Record<string, { title: string; logo_url: string | null; type: string }>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await (supabase as any).from("verification_request_items")
      .select("id, request_id, vic_id, auftrag_key, verification_id, status, created_at")
      .neq("status", "gestartet").order("created_at", { ascending: false }).limit(1000);
    setItems((data ?? []) as Item[]);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    supabase.from("verifications").select("id, title, logo_url, type").then(({ data }) =>
      setVerifs(Object.fromEntries((data ?? []).map((v: any) => [v.id, v]))));
  }, []);

  // Only Vics with at least one ready item get a card.
  const groups = useMemo(() => {
    const byVic = new Map<string, Item[]>();
    for (const i of items) {
      if (vicIds && !vicIds.has(i.vic_id)) continue;
      byVic.set(i.vic_id, [...(byVic.get(i.vic_id) ?? []), i]);
    }
    return [...byVic.entries()].filter(([, l]) => l.some((i) => i.status === "bereit"));
  }, [items, vicIds]);

  useEffect(() => {
    const ids = groups.map(([id]) => id).filter((id) => !names[id]);
    if (!ids.length) return;
    supabase.from("profiles").select("id, first_name, last_name, email").in("id", ids).then(({ data }) =>
      setNames((n) => ({ ...n, ...Object.fromEntries((data ?? []).map((p) => [p.id, { n: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.id, e: p.email ?? "" }])) as any })));
  }, [groups]);

  const start = async (id: string) => {
    setBusy(id);
    const { data, error } = await supabase.functions.invoke("start-prepared-item", { body: { item_id: id } });
    setBusy(null);
    if (error || data?.error) { toast.error((data as any)?.error ?? "Starten fehlgeschlagen"); return; }
    toast.success("Auftrag gestartet und dem Vic zugewiesen");
    setItems((l) => l.filter((i) => i.id !== id));
    onChanged?.();
  };

  if (!groups.length) return null;
  const order: Record<string, number> = { bereit: 0, in_bearbeitung: 1, fehlgeschlagen: 2 };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase text-muted-foreground" style={{ letterSpacing: "0.08em" }}>
        Bereit zum Start ({groups.length})
      </h3>
      <div className="grid gap-3 xl:grid-cols-2">
        {groups.map(([vicId, list]) => {
          const nm = (names as any)[vicId];
          return (
            <Card key={vicId} className="p-4">
              <div className="mb-3">
                <p className="text-sm font-semibold">{nm?.n ?? "…"}</p>
                {nm?.e && <p className="text-xs text-muted-foreground">{nm.e}</p>}
              </div>
              <div className="divide-y divide-border">
                {[...list].sort((a, b) => order[a.status] - order[b.status]).map((i) => {
                  const v = i.verification_id ? verifs[i.verification_id] : undefined;
                  const { bank, sub } = splitVerificationTitle(v?.title ?? i.auftrag_key.replace("-", " — "));
                  return (
                    <div key={i.id} className="flex items-center gap-3 py-2">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-card flex items-center justify-center">
                        {v?.logo_url
                          ? <VerificationLogo value={v.logo_url} alt={bank} className="h-full w-full object-contain" />
                          : <span className="text-xs font-semibold text-muted-foreground">{bank.slice(0, 2).toUpperCase()}</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{bank}</p>
                        <p className="text-xs text-muted-foreground">{sub || (v?.type === "postident" ? "Postident" : "Video-Ident")}</p>
                      </div>
                      {i.status === "bereit" && (
                        <>
                          <Badge variant="outline" className="gap-1 border-success/50 text-success"><Check className="h-3 w-3" /> Bereit</Badge>
                          <Button size="sm" className="gap-1.5" disabled={busy !== null} onClick={() => start(i.id)}>
                            {busy === i.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Starten
                          </Button>
                        </>
                      )}
                      {i.status === "in_bearbeitung" && (
                        <Badge variant="outline" className="gap-1 border-warning/50 text-warning"><Clock className="h-3 w-3" /> In Bearbeitung</Badge>
                      )}
                      {i.status === "fehlgeschlagen" && (
                        <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Auftrag nicht möglich</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
