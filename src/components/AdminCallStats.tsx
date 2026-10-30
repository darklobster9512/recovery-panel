import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, PhoneIncoming, PhoneOutgoing, Clock } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePagination } from "@/hooks/usePagination";
import TablePagination from "@/components/TablePagination";
import { Period, berlinToday, periodRange, toKey, fmtHM, fmtMS, isoWeek } from "@/lib/callStats";

type Totals = { today_sec: number; week_sec: number; month_sec: number };
type ByCaller = { caller_id: string | null; caller_name: string | null; calls: number; total_sec: number; avg_sec: number; missed: number };
type ByDay = { day: string; total_sec: number };
type Call = {
  id: string; caller_id: string | null; caller_name: string | null; direction: string; remote_number: string | null;
  remote_name: string | null; status: string; started_at: string; duration_sec: number;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  answered: { label: "Angenommen", cls: "border-success text-success" },
  missed: { label: "Verpasst", cls: "border-destructive text-destructive" },
  rejected: { label: "Abgelehnt", cls: "border-warning text-warning" },
  busy: { label: "Besetzt", cls: "border-muted-foreground text-muted-foreground" },
};

const dm = (d: Date) => d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });

export default function AdminCallStats() {
  const [period, setPeriod] = useState<Period>("week");
  const [offset, setOffset] = useState(0);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [byCaller, setByCaller] = useState<ByCaller[]>([]);
  const [byDay, setByDay] = useState<ByDay[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [callerFilter, setCallerFilter] = useState("all");

  const range = useMemo(() => periodRange(period, berlinToday(), offset), [period, offset]);
  const label = period === "day"
    ? range.from.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })
    : period === "week"
      ? `KW ${isoWeek(range.from)} · ${dm(range.from)}–${range.to.toLocaleDateString("de-DE")}`
      : range.from.toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  useEffect(() => {
    supabase.rpc("call_stats_totals").then(({ data }) => setTotals((data as Totals[] | null)?.[0] ?? null));
    supabase.from("call_logs").select("id,caller_id,caller_name,direction,remote_number,remote_name,status,started_at,duration_sec")
      .order("started_at", { ascending: false }).limit(1000).then(({ data }) => setCalls((data as Call[]) ?? []));
  }, []);

  useEffect(() => {
    const p = { _from: toKey(range.from), _to: toKey(range.to) };
    supabase.rpc("call_stats_by_caller", p).then(({ data }) => setByCaller((data as ByCaller[]) ?? []));
    supabase.rpc("call_stats_by_day", p).then(({ data }) => setByDay((data as ByDay[]) ?? []));
  }, [range]);

  const callers = useMemo(() => {
    const m = new Map<string, string>();
    calls.forEach((c) => m.set(c.caller_id ?? "none", c.caller_name || "Unbekannt"));
    return [...m.entries()];
  }, [calls]);
  const filtered = useMemo(
    () => callerFilter === "all" ? calls : calls.filter((c) => (c.caller_id ?? "none") === callerFilter),
    [calls, callerFilter]);
  const pg = usePagination(filtered);

  const chart = byDay.map((d) => ({
    name: new Date(d.day + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
    min: Math.round(Number(d.total_sec) / 60), sec: Number(d.total_sec),
  }));

  const kpis = [
    { t: "Heute", v: totals?.today_sec ?? 0 },
    { t: "Diese Woche", v: totals?.week_sec ?? 0 },
    { t: "Dieser Monat", v: totals?.month_sec ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.t}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3"><Clock className="w-5 h-5 text-primary" /></div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground">{k.t}</div>
                <div className="text-2xl font-bold tabular-nums">{fmtHM(Number(k.v))} <span className="text-sm font-medium text-muted-foreground">h</span></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={period} onValueChange={(v) => { setPeriod(v as Period); setOffset(0); }}>
          <TabsList>
            <TabsTrigger value="day">Tag</TabsTrigger>
            <TabsTrigger value="week">Woche</TabsTrigger>
            <TabsTrigger value="month">Monat</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="icon" className="rounded-full" onClick={() => setOffset(offset - 1)} aria-label="Zurück"><ChevronLeft className="w-4 h-4" /></Button>
        <Button variant="outline" size="icon" className="rounded-full" onClick={() => setOffset(offset + 1)} aria-label="Vor"><ChevronRight className="w-4 h-4" /></Button>
        <span className="text-sm font-semibold">{label}</span>
        {offset !== 0 && <Button variant="ghost" size="sm" onClick={() => setOffset(0)}>Aktuell</Button>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Pro Caller</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Caller</TableHead><TableHead className="text-right">Gespräche</TableHead>
                <TableHead className="text-right">Telefonzeit</TableHead><TableHead className="text-right">Ø</TableHead>
                <TableHead className="text-right">Verpasst</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {byCaller.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Keine Anrufe im Zeitraum</TableCell></TableRow>}
                {byCaller.map((r) => (
                  <TableRow key={r.caller_id ?? "none"}>
                    <TableCell className="font-medium">{r.caller_name || "Unbekannt"}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.calls}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtHM(Number(r.total_sec))}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMS(Number(r.avg_sec))}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.missed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Telefonzeit pro Tag (Minuten)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={36} />
                <Tooltip formatter={(_v, _n, p) => [`${fmtHM((p.payload as { sec: number }).sec)} h`, "Telefonzeit"]}
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="min" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Letzte Anrufe</CardTitle>
          <Select value={callerFilter} onValueChange={setCallerFilter}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Caller</SelectItem>
              {callers.map(([id, n]) => <SelectItem key={id} value={id}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Zeit</TableHead><TableHead>Caller</TableHead><TableHead>Richtung</TableHead>
              <TableHead>Gegenstelle</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Dauer</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {pg.pageItems.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Noch keine Anrufe</TableCell></TableRow>}
              {pg.pageItems.map((c) => {
                const st = STATUS[c.status] ?? { label: c.status, cls: "" };
                return (
                  <TableRow key={c.id}>
                    <TableCell className="tabular-nums whitespace-nowrap">{new Date(c.started_at).toLocaleString("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</TableCell>
                    <TableCell>{c.caller_name || "Unbekannt"}</TableCell>
                    <TableCell>{c.direction === "in"
                      ? <span className="inline-flex items-center gap-1"><PhoneIncoming className="w-4 h-4 text-primary" />Ein</span>
                      : <span className="inline-flex items-center gap-1"><PhoneOutgoing className="w-4 h-4 text-muted-foreground" />Aus</span>}</TableCell>
                    <TableCell>{c.remote_name ? <>{c.remote_name} <span className="text-muted-foreground text-xs">{c.remote_number}</span></> : c.remote_number || "–"}</TableCell>
                    <TableCell><Badge variant="outline" className={st.cls}>{st.label}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMS(c.duration_sec)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <TablePagination {...pg} />
        </CardContent>
      </Card>
    </div>
  );
}
