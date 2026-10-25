import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import VerificationLogo from "@/components/VerificationLogo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Check, Clock, Loader2, Phone, Mail, Play } from "lucide-react";
import { toast } from "sonner";
import { splitVerificationTitle } from "@/lib/verificationRequests";

interface Item {
  id: string; request_id: string; vic_id: string; auftrag_key: string; verification_id: string | null;
  status: string; created_at: string; assignment_id?: string | null;
}
interface Req {
  id: string; vic_id: string; first_name: string; last_name: string; birth_name: string | null; birth_date: string | null;
  birth_place: string | null; street: string | null; postal_code: string | null; city: string | null; bank: string; created_at: string;
}

const fmt = (iso: string) => new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const order: Record<string, number> = { bereit: 0, gestartet: 1, in_bearbeitung: 2, fehlgeschlagen: 3 }
const DONE = new Set(["in_ueberpruefung", "genehmigt", "abgelehnt"]);;

export default function PreparedVerificationCards({ vicIds, onChanged, onMovedChange }: {
  vicIds: Set<string> | null; onChanged?: () => void; onMovedChange?: (ids: Set<string>) => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [verifs, setVerifs] = useState<Record<string, { title: string; logo_url: string | null; type: string }>>({});
  const [reqs, setReqs] = useState<Record<string, Req>>({});
  const [profiles, setProfiles] = useState<Record<string, { phone: string | null; email: string | null }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [aStatus, setAStatus] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (text: string, key: string, msg: string) => {
    try { await navigator.clipboard.writeText(text); toast.success(msg); setCopied(key); setTimeout(() => setCopied(null), 1500); }
    catch { toast.error("Kopieren fehlgeschlagen"); }
  };

  const load = useCallback(async () => {
    const { data } = await (supabase as any).from("verification_request_items")
      .select("id, request_id, vic_id, auftrag_key, verification_id, status, created_at, assignment_id")
      .order("created_at", { ascending: false }).limit(1000);
    const list = (data ?? []) as Item[];
    const aIds = list.filter((i) => i.status === "gestartet" && i.assignment_id).map((i) => i.assignment_id!);
    if (aIds.length) {
      const { data: as } = await supabase.from("verification_assignments").select("id, status").in("id", aIds);
      setAStatus(Object.fromEntries((as ?? []).map((a) => [a.id, a.status])));
    }
    setItems(list);
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);
  useEffect(() => {
    supabase.from("verifications").select("id, title, logo_url, type").then(({ data }) =>
      setVerifs(Object.fromEntries((data ?? []).map((v: any) => [v.id, v]))));
  }, []);

  // A request "moved" once the panel delivered any result for it.
  const moved = useMemo(() => {
    const s = new Set<string>();
    for (const i of items) if (i.status !== "in_bearbeitung") s.add(i.request_id);
    return s;
  }, [items]);
  useEffect(() => { onMovedChange?.(moved); }, [moved, onMovedChange]);

  const groups = useMemo(() => {
    const byReq = new Map<string, Item[]>();
    for (const i of items) {
      if (vicIds && !vicIds.has(i.vic_id)) continue;
      if (!moved.has(i.request_id)) continue;
      byReq.set(i.request_id, [...(byReq.get(i.request_id) ?? []), i]);
    }
    return [...byReq.entries()]
      .map(([id, l]) => [id, l.filter((i) => !(i.status === "gestartet" && i.assignment_id && DONE.has(aStatus[i.assignment_id] ?? "")))] as const)
      .filter(([, l]) => l.some((i) => i.status === "bereit" || i.status === "in_bearbeitung" || i.status === "gestartet"));
  }, [items, vicIds, moved, aStatus]);

  useEffect(() => {
    const ids = groups.map(([id]) => id).filter((id) => !reqs[id]);
    if (!ids.length) return;
    (supabase as any).from("verification_requests")
      .select("id, vic_id, first_name, last_name, birth_name, birth_date, birth_place, street, postal_code, city, bank, created_at")
      .in("id", ids).then(({ data }: any) => setReqs((r) => ({ ...r, ...Object.fromEntries((data ?? []).map((x: Req) => [x.id, x])) })));
  }, [groups]);

  useEffect(() => {
    const ids = [...new Set(groups.map(([, l]) => l[0]?.vic_id).filter(Boolean))].filter((id) => !profiles[id!]) as string[];
    if (!ids.length) return;
    supabase.from("profiles").select("id, phone, email").in("id", ids).then(({ data }) =>
      setProfiles((p) => ({ ...p, ...Object.fromEntries((data ?? []).map((x) => [x.id, { phone: x.phone, email: x.email }])) })));
  }, [groups]);

  const start = async (id: string) => {
    setBusy(id);
    const { data, error } = await supabase.functions.invoke("start-prepared-item", { body: { item_id: id } });
    setBusy(null);
    if (error || data?.error) { toast.error((data as any)?.error ?? "Starten fehlgeschlagen"); return; }
    toast.success("Auftrag gestartet und dem Vic zugewiesen");
    setItems((l) => l.map((i) => (i.id === id ? { ...i, status: "gestartet", assignment_id: (data as any)?.assignment_id ?? null } : i)));
    onChanged?.();
  };

  const info = (i: Item) => {
    const v = i.verification_id ? verifs[i.verification_id] : undefined;
    const title = v?.title ?? i.auftrag_key.replace("-", " — ");
    const { bank, sub } = splitVerificationTitle(title);
    return { v, title, bank, sub: sub || (v?.type === "postident" ? "Postident" : "Video-Ident") };
  };

  const openGroup = groups.find(([id]) => id === openId);
  useEffect(() => { if (openId && !openGroup) setOpenId(null); }, [openId, openGroup]);

  if (!groups.length) return null;
  const openReq = openId ? reqs[openId] : undefined;
  const openProf = openGroup ? profiles[openGroup[1][0]?.vic_id] : undefined;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase text-muted-foreground" style={{ letterSpacing: "0.08em" }}>
        Bereit zum Start ({groups.length})
      </h3>
      <div className="flex flex-wrap items-start gap-2">
        {groups.map(([reqId, list]) => {
          const r = reqs[reqId];
          return (
            <Card key={reqId} onClick={() => setOpenId(reqId)}
              className="w-fit max-w-full cursor-pointer p-3 transition-all hover:border-primary/50 hover:shadow-md">
              <p className="text-sm font-semibold">{r ? `${r.first_name} ${r.last_name}` : "…"}</p>
              {r && <p className="text-xs text-muted-foreground">{fmt(r.created_at)} · Eigene Bank: {r.bank}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[...list].sort((a, b) => order[a.status] - order[b.status]).map((i) => {
                  const { v, title, bank } = info(i);
                  const cls = i.status === "fehlgeschlagen" ? "border-2 border-destructive" : i.status === "in_bearbeitung" ? "border-dashed border-border opacity-80 grayscale-[50%]" : i.status === "gestartet" ? "border-2 border-warning" : "border-2 border-success";
                  return (
                    <div key={i.id} title={title} className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-card ${cls}`}>
                      <VerificationLogo value={v?.logo_url ?? null} alt={bank} className="h-full w-full object-contain p-1"
                        fallback={<span className="text-xs font-semibold text-muted-foreground">{bank.slice(0, 2).toUpperCase()}</span>} />
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!openGroup} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{openReq ? `${openReq.first_name} ${openReq.last_name}` : "Vic"}</DialogTitle>
          </DialogHeader>
          {openReq && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {openProf?.phone && (
                  <Button size="sm" className="gap-1.5" onClick={() => copy(openProf.phone!, "phone", "Telefonnummer kopiert")}>
                    {copied === "phone" ? <Check className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />} {openProf.phone}
                  </Button>
                )}
                {openProf?.email && (
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => copy(openProf.email!, "email", "E-Mail kopiert")}>
                    {copied === "email" ? <Check className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />} {openProf.email}
                  </Button>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-border p-3 text-sm sm:grid-cols-3">
                {([
                  ["Geburtsname", openReq.birth_name], ["Geburtsdatum", openReq.birth_date], ["Geburtsort", openReq.birth_place],
                  ["Straße", openReq.street], ["PLZ / Ort", [openReq.postal_code, openReq.city].filter(Boolean).join(" ")], ["Eigene Bank", openReq.bank],
                ] as const).map(([k, val]) => (
                  <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{val || "—"}</dd></div>
                ))}
              </dl>
            </div>
          )}
          {openGroup && (
            <div className="divide-y divide-border">
              {[...openGroup[1]].sort((a, b) => order[a.status] - order[b.status]).map((i) => {
                const { v, bank, sub } = info(i);
                return (
                  <div key={i.id} className="flex items-center gap-3 py-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-card">
                      <VerificationLogo value={v?.logo_url ?? null} alt={bank} className="h-full w-full object-contain p-1"
                        fallback={<span className="text-xs font-semibold text-muted-foreground">{bank.slice(0, 2).toUpperCase()}</span>} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{bank}</p>
                      <p className="text-xs text-muted-foreground">{sub}</p>
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
                    {i.status === "gestartet" && (
                      <Badge variant="outline" className="gap-1 border-warning/50 text-warning"><Play className="h-3 w-3" /> Zugewiesen</Badge>
                    )}
                    {i.status === "fehlgeschlagen" && (
                      <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Auftrag nicht möglich</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
