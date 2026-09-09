import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Mail, Phone, Inbox } from "lucide-react";

type Status = "neu" | "in_bearbeitung" | "erledigt";

interface ContactRequest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  topic: string;
  damage_amount: number | null;
  message: string;
  status: Status;
  source: string | null;
  created_at: string;
}

const STATUS_META: Record<Status, { label: string; className: string }> = {
  neu: { label: "Neu", className: "bg-blue-100 text-blue-800 border-blue-200" },
  in_bearbeitung: { label: "In Bearbeitung", className: "bg-amber-100 text-amber-800 border-amber-200" },
  erledigt: { label: "Erledigt", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

function formatDateTime(v: string): string {
  const d = new Date(v);
  return d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatEur(n: number | null): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function truncate(s: string, n = 60): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export default function AdminContactRequests() {
  const { toast } = useToast();
  const [rows, setRows] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("alle");
  const [selected, setSelected] = useState<ContactRequest | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("contact_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Fehler beim Laden", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    setRows((data ?? []) as ContactRequest[]);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("contact_requests_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_requests" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "alle" && r.status !== statusFilter) return false;
      if (!q) return true;
      const hay = `${r.first_name} ${r.last_name} ${r.email} ${r.phone ?? ""} ${r.topic} ${r.message}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, statusFilter]);

  const updateStatus = async (id: string, status: Status) => {
    const prev = rows;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    if (selected?.id === id) setSelected({ ...selected, status });
    const { error } = await supabase.from("contact_requests").update({ status }).eq("id", id);
    if (error) {
      setRows(prev);
      toast({ title: "Statusänderung fehlgeschlagen", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Inbox className="h-4 w-4" />
            {rows.length} Anfragen insgesamt
          </div>
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Suchen (Name, E-Mail, Anliegen…)" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Status</SelectItem>
              <SelectItem value="neu">Neu</SelectItem>
              <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
              <SelectItem value="erledigt">Erledigt</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 flex justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Keine Anfragen gefunden.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Eingegangen</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Anliegen</TableHead>
                  <TableHead>Schadenshöhe</TableHead>
                  <TableHead>Nachricht</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelected(r)}>
                    <TableCell className="whitespace-nowrap">{formatDateTime(r.created_at)}</TableCell>
                    <TableCell className="font-medium">{r.first_name} {r.last_name}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.phone || "—"}</TableCell>
                    <TableCell>{truncate(r.topic, 30)}</TableCell>
                    <TableCell>{formatEur(r.damage_amount)}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{truncate(r.message, 60)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v as Status)}>
                        <SelectTrigger className="h-8 w-[150px]">
                          <SelectValue>
                            <Badge variant="outline" className={STATUS_META[r.status].className}>
                              {STATUS_META[r.status].label}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(STATUS_META) as Status[]).map((s) => (
                            <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.first_name} {selected.last_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{selected.email}</div>
                  {selected.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{selected.phone}</div>}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Anliegen</div>
                    <div>{selected.topic}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Schadenshöhe</div>
                    <div>{formatEur(selected.damage_amount)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Eingegangen</div>
                    <div>{formatDateTime(selected.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Status</div>
                    <Select value={selected.status} onValueChange={(v) => updateStatus(selected.id, v as Status)}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(STATUS_META) as Status[]).map((s) => (
                          <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs mb-1">Nachricht</div>
                  <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">{selected.message}</div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
