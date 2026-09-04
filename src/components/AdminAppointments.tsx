import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRightLeft } from "lucide-react";
import { APPOINTMENT_STATUS_LABELS, formatDateLong, formatTime } from "@/lib/booking";

type Row = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  is_transferred: boolean;
  caller_id: string | null;
  vic_id: string;
  vic?: { first_name: string | null; last_name: string | null; email: string | null } | null;
  caller?: { first_name: string | null; last_name: string | null; email: string | null } | null;
};

export default function AdminAppointments() {
  const { role, user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [role, user?.id]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("id, appointment_date, appointment_time, status, is_transferred, caller_id, vic_id")
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });
    if (error) { toast({ title: "Fehler", description: error.message, variant: "destructive" }); setLoading(false); return; }
    const vicIds = Array.from(new Set((data ?? []).map((r) => r.vic_id)));
    const callerIds = Array.from(new Set((data ?? []).map((r) => r.caller_id).filter(Boolean) as string[]));
    const [vics, callers] = await Promise.all([
      vicIds.length ? supabase.from("profiles").select("id, first_name, last_name, email").in("id", vicIds) : Promise.resolve({ data: [] as any[] }),
      callerIds.length ? supabase.from("profiles").select("id, first_name, last_name, email").in("id", callerIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const vicMap = new Map<string, any>((vics.data ?? []).map((p: any) => [p.id, p]));
    const callerMap = new Map<string, any>((callers.data ?? []).map((p: any) => [p.id, p]));
    setRows(((data ?? []) as any[]).map((r) => ({ ...r, vic: vicMap.get(r.vic_id) ?? null, caller: r.caller_id ? callerMap.get(r.caller_id) ?? null : null })));
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      const parts = [r.vic?.first_name, r.vic?.last_name, r.vic?.email, r.caller?.first_name, r.caller?.last_name].filter(Boolean).join(" ").toLowerCase();
      return parts.includes(q);
    });
  }, [rows, statusFilter, search]);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return toast({ title: "Fehler", description: error.message, variant: "destructive" });
    setRows((r) => r.map((x) => x.id === id ? { ...x, status } : x));
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <p className="mb-2 text-xs font-bold uppercase text-primary" style={{ letterSpacing: "0.08em" }}>Vertrieb</p>
        <h2 className="font-display text-2xl font-semibold">Termine</h2>
        <p className="mt-2 text-sm text-muted-foreground">Alle Telefontermine der Vics.</p>
      </div>
      <Card>
        <CardHeader className="border-b border-border px-5 py-4">
          <CardTitle className="text-base">Buchungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-wrap gap-3">
            <Input placeholder="Vic oder Caller suchen" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                {Object.entries(APPOINTMENT_STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Keine Termine gefunden.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                    <th className="py-2 pr-4">Datum</th>
                    <th className="py-2 pr-4">Zeit</th>
                    <th className="py-2 pr-4">Vic</th>
                    <th className="py-2 pr-4">Caller</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-2 pr-4">{formatDateLong(r.appointment_date)}</td>
                      <td className="py-2 pr-4">{formatTime(r.appointment_time)}</td>
                      <td className="py-2 pr-4">
                        <div className="font-medium">{[r.vic?.first_name, r.vic?.last_name].filter(Boolean).join(" ") || "—"}</div>
                        <div className="text-xs text-muted-foreground">{r.vic?.email}</div>
                      </td>
                      <td className="py-2 pr-4">
                        {r.caller ? [r.caller.first_name, r.caller.last_name].filter(Boolean).join(" ") : <span className="text-muted-foreground">Kanzlei</span>}
                        {r.is_transferred && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-semibold">
                            <ArrowRightLeft className="w-3 h-3" /> übertragen
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        <Select value={r.status} onValueChange={(v) => setStatus(r.id, v)}>
                          <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(APPOINTMENT_STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 pr-4">
                        <Button variant="ghost" size="sm" onClick={() => setStatus(r.id, "abgesagt")}>Absagen</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
