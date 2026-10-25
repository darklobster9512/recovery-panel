import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AssignmentStatusBadge, type AssignmentStatus } from "@/components/AssignmentStatusBadge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import {
  UserPlus, FilePlus, ArrowRight, ShieldCheck, MessageSquare, CalendarClock, Inbox,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { LEAD_STATUSES, CAMPAIGN_META, type LeadCampaign } from "@/lib/leads";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/booking";
import { cn } from "@/lib/utils";

const DAY = 24 * 60 * 60 * 1000;

const PIPELINE: { status: AssignmentStatus; label: string; color: string }[] = [
  { status: "zugewiesen", label: "Zugewiesen", color: "hsl(var(--muted-foreground))" },
  { status: "in_bearbeitung", label: "In Bearbeitung", color: "hsl(var(--primary))" },
  { status: "in_ueberpruefung", label: "Überprüfung", color: "hsl(38 92% 50%)" },
  { status: "abgeschlossen", label: "Abgeschlossen", color: "hsl(142 71% 40%)" },
  { status: "genehmigt", label: "Genehmigt", color: "hsl(160 60% 35%)" },
  { status: "abgelehnt", label: "Abgelehnt", color: "hsl(0 72% 51%)" },
];

const activityConfig = {
  leads: { label: "Neue Leads", color: "hsl(var(--primary))" },
  vics: { label: "Neue Vics", color: "hsl(142 71% 40%)" },
  assignments: { label: "Neue Zuweisungen", color: "hsl(38 92% 50%)" },
} satisfies ChartConfig;

const countConfig = { count: { label: "Anzahl", color: "hsl(var(--primary))" } } satisfies ChartConfig;

interface AssignmentRow { id: string; user_id: string; verification_id: string; status: AssignmentStatus; created_at: string }
interface LeadRow { status: string; campaign: string | null; imported_at: string; assigned_caller_id: string | null }
interface ApptRow { id: string; vic_id: string; caller_id: string | null; appointment_date: string; appointment_time: string; status: string }
interface CallerRow { id: string; name: string; vics: number; open: number; weekAssignments: number }
interface NoCallerVic { id: string; first_name: string | null; last_name: string | null; email: string | null; created_at: string }
interface RecentAssignment extends AssignmentRow { userName: string; verificationTitle: string }
interface UpcomingAppt extends ApptRow { vicName: string; callerName: string }

function ymd(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function personName(p?: { first_name: string | null; last_name: string | null; email: string | null }) {
  if (!p) return "—";
  return `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email || "—";
}

function Trend({ current, previous, suffix = "" }: { current: number; previous: number; suffix?: string }) {
  const diff = current - previous;
  if (diff === 0) {
    return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Minus className="h-3 w-3" /> unverändert</span>;
  }
  const up = diff > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", up ? "text-green-600" : "text-destructive")}>
      <Icon className="h-3 w-3" />
      {up ? "+" : ""}{diff}{suffix} zur Vorwoche
    </span>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [newVicDates, setNewVicDates] = useState<string[]>([]);
  const [recentAssignDates, setRecentAssignDates] = useState<string[]>([]);
  const [todayAppts, setTodayAppts] = useState<UpcomingAppt[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingAppt[]>([]);
  const [callers, setCallers] = useState<CallerRow[]>([]);
  const [recent, setRecent] = useState<RecentAssignment[]>([]);
  const [totalVics, setTotalVics] = useState(0);
  const [noCaller, setNoCaller] = useState<NoCallerVic[]>([]);
  const [docDates, setDocDates] = useState<string[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const now = new Date();
    const since14 = new Date(now.getTime() - 14 * DAY).toISOString();
    const since7 = new Date(now.getTime() - 7 * DAY).toISOString();
    const today = ymd(now);

    const countByStatus = (status: AssignmentStatus) =>
      supabase.from("verification_assignments").select("id", { count: "exact", head: true }).eq("status", status);

    const [
      rolesRes, leadsRes, newProfilesRes, assign14Res, openAssignRes, recentRes,
      unreadRes, apptRes, ...statusCounts
    ] = await Promise.all([
      supabase.from("user_roles").select("user_id, role").in("role", ["admin", "caller"]),
      supabase.from("leads").select("status, campaign, imported_at, assigned_caller_id").order("imported_at", { ascending: false }).limit(1000),
      supabase.from("profiles").select("id, created_at").gte("created_at", since14).limit(1000),
      supabase.from("verification_assignments").select("id, user_id, created_at, status").gte("created_at", since14).limit(1000),
      supabase.from("verification_assignments").select("user_id, status").in("status", ["zugewiesen", "in_bearbeitung", "in_ueberpruefung"]).limit(1000),
      supabase.from("verification_assignments").select("id, user_id, verification_id, status, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("chat_messages").select("vic_id").eq("sender_role", "vic").is("read_at_team", null).limit(1000),
      supabase.from("appointments").select("id, vic_id, caller_id, appointment_date, appointment_time, status").gte("appointment_date", today).eq("status", "gebucht").order("appointment_date").order("appointment_time").limit(200),
      ...PIPELINE.map((p) => countByStatus(p.status)),
    ]);

    const staffRoles = (rolesRes.data ?? []) as { user_id: string; role: string }[];
    const staffIds = new Set(staffRoles.map((r) => r.user_id));
    const callerIds = staffRoles.filter((r) => r.role === "caller").map((r) => r.user_id);

    const pipe: Record<string, number> = {};
    PIPELINE.forEach((p, i) => { pipe[p.status] = statusCounts[i].count ?? 0; });
    setPipeline(pipe);
    setReview(pipe["in_ueberpruefung"] ?? 0);

    setLeads((leadsRes.data ?? []) as LeadRow[]);
    setNewVicDates(((newProfilesRes.data ?? []) as { id: string; created_at: string }[]).filter((p) => !staffIds.has(p.id)).map((p) => p.created_at));
    setRecentAssignDates(((assign14Res.data ?? []) as { created_at: string }[]).map((a) => a.created_at));

    const unread = (unreadRes.data ?? []) as { vic_id: string }[];
    setUnreadMsgs(unread.length);
    setUnreadChats(new Set(unread.map((u) => u.vic_id)).size);

    const [vicsCount, noCallerRes, docsRes, docsCount] = await Promise.all([
      supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "user"),
      supabase.from("profiles").select("id, first_name, last_name, email, created_at").is("assigned_caller_id", null).order("created_at", { ascending: false }).limit(1000),
      supabase.from("user_documents").select("created_at").gte("created_at", since14).limit(1000),
      supabase.from("user_documents").select("id", { count: "exact", head: true }),
    ]);
    setTotalVics(vicsCount.count ?? 0);
    setNoCaller(((noCallerRes.data ?? []) as NoCallerVic[]).filter((p) => !staffIds.has(p.id)));
    setDocDates(((docsRes.data ?? []) as { created_at: string }[]).map((d) => d.created_at));
    setTotalDocs(docsCount.count ?? 0);

    // Termine + Namen
    const appts = (apptRes.data ?? []) as ApptRow[];
    const apptVicIds = [...new Set(appts.slice(0, 20).map((a) => a.vic_id))];
    const apptCallerIds = [...new Set(appts.slice(0, 20).map((a) => a.caller_id).filter(Boolean) as string[])];

    // Caller-Übersicht
    const [vicProfiles, callerProfiles, callerVics, week] = await Promise.all([
      apptVicIds.length ? supabase.from("profiles").select("id, first_name, last_name, email").in("id", apptVicIds) : Promise.resolve({ data: [] as any[] }),
      callerIds.length ? supabase.from("profiles").select("id, first_name, last_name, email").in("id", callerIds) : Promise.resolve({ data: [] as any[] }),
      callerIds.length ? supabase.from("profiles").select("id, assigned_caller_id").in("assigned_caller_id", callerIds).limit(1000) : Promise.resolve({ data: [] as any[] }),
      supabase.from("verification_assignments").select("user_id").gte("created_at", since7).limit(1000),
    ]);
    void apptCallerIds;

    const vicMap = Object.fromEntries((vicProfiles.data ?? []).map((p: any) => [p.id, p]));
    const callerMap = Object.fromEntries((callerProfiles.data ?? []).map((p: any) => [p.id, p]));
    const enrich = (a: ApptRow): UpcomingAppt => ({
      ...a,
      vicName: personName(vicMap[a.vic_id]),
      callerName: a.caller_id ? personName(callerMap[a.caller_id]) : "Nicht zugewiesen",
    });
    setTodayAppts(appts.filter((a) => a.appointment_date === today).map(enrich));
    setUpcoming(appts.slice(0, 5).map(enrich));

    const vicToCaller: Record<string, string> = {};
    (callerVics.data ?? []).forEach((p: any) => { vicToCaller[p.id] = p.assigned_caller_id; });
    const weekByCaller: Record<string, number> = {};
    (week.data ?? []).forEach((a: any) => { const c = vicToCaller[a.user_id]; if (c) weekByCaller[c] = (weekByCaller[c] ?? 0) + 1; });
    const openByCaller: Record<string, number> = {};
    (openAssignRes.data ?? []).forEach((a: any) => { const c = vicToCaller[a.user_id]; if (c) openByCaller[c] = (openByCaller[c] ?? 0) + 1; });
    const vicsByCaller: Record<string, number> = {};
    Object.values(vicToCaller).forEach((c) => { vicsByCaller[c] = (vicsByCaller[c] ?? 0) + 1; });
    setCallers(
      callerIds
        .map((id) => ({
          id,
          name: personName(callerMap[id]),
          vics: vicsByCaller[id] ?? 0,
          open: openByCaller[id] ?? 0,
          weekAssignments: weekByCaller[id] ?? 0,
        }))
        .sort((a, b) => b.open - a.open),
    );

    // Letzte Zuweisungen
    const recent5 = (recentRes.data ?? []) as AssignmentRow[];
    if (recent5.length) {
      const userIds = [...new Set(recent5.map((a) => a.user_id))];
      const verIds = [...new Set(recent5.map((a) => a.verification_id))];
      const [profiles, verifications] = await Promise.all([
        supabase.from("profiles").select("id, first_name, last_name, email").in("id", userIds),
        supabase.from("verifications").select("id, title").in("id", verIds),
      ]);
      const pMap = Object.fromEntries((profiles.data ?? []).map((p) => [p.id, p]));
      const vMap = Object.fromEntries((verifications.data ?? []).map((v) => [v.id, v]));
      setRecent(recent5.map((a) => ({ ...a, userName: personName(pMap[a.user_id]), verificationTitle: vMap[a.verification_id]?.title ?? "—" })));
    } else {
      setRecent([]);
    }

    setLoading(false);
  }

  const stats = useMemo(() => {
    const now = Date.now();
    const inRange = (iso: string, from: number, to: number) => {
      const t = new Date(iso).getTime();
      return t >= now - from * DAY && t < now - to * DAY;
    };
    const cnt = (arr: string[], from: number, to: number) => arr.filter((d) => inRange(d, from, to)).length;
    const leadDates = leads.map((l) => l.imported_at);
    const total = Object.values(pipeline).reduce((s, n) => s + n, 0);
    return {
      vics: [cnt(newVicDates, 7, 0), cnt(newVicDates, 14, 7)],
      leads: [cnt(leadDates, 7, 0), cnt(leadDates, 14, 7)],
      assignments: [cnt(recentAssignDates, 7, 0), cnt(recentAssignDates, 14, 7)],
      docs: [cnt(docDates, 7, 0), cnt(docDates, 14, 7)],
      total,
    };
  }, [leads, newVicDates, recentAssignDates, pipeline, docDates]);

  const activity = useMemo(() => {
    const days: { key: string; label: string; leads: number; vics: number; assignments: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY);
      days.push({ key: ymd(d), label: d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }), leads: 0, vics: 0, assignments: 0 });
    }
    const idx = Object.fromEntries(days.map((d, i) => [d.key, i]));
    const add = (iso: string, field: "leads" | "vics" | "assignments") => {
      const i = idx[ymd(new Date(iso))];
      if (i !== undefined) days[i][field]++;
    };
    leads.forEach((l) => add(l.imported_at, "leads"));
    newVicDates.forEach((d) => add(d, "vics"));
    recentAssignDates.forEach((d) => add(d, "assignments"));
    return days;
  }, [leads, newVicDates, recentAssignDates]);

  const pipelineData = PIPELINE.map((p) => ({ name: p.label, count: pipeline[p.status] ?? 0, color: p.color }));

  const leadData = useMemo(() => {
    return LEAD_STATUSES.map((s) => {
      const inStatus = leads.filter((l) => l.status === s.value);
      return {
        name: s.label,
        kanzlei: inStatus.filter((l) => l.campaign === "kanzlei").length,
        europol: inStatus.filter((l) => l.campaign === "europol").length,
      };
    });
  }, [leads]);
  const leadChartConfig = {
    kanzlei: { label: CAMPAIGN_META.kanzlei.label, color: "hsl(38 92% 50%)" },
    europol: { label: CAMPAIGN_META.europol.label, color: "hsl(var(--primary))" },
  } satisfies ChartConfig;

  const unassignedVics = noCaller.length;
  const nextToday = todayAppts[0];

  const todo = [
    { label: "Zur Überprüfung", value: review, meta: review === 1 ? "Auftrag wartet auf Prüfung" : "Aufträge warten auf Prüfung", icon: ShieldCheck, to: "/admin/ueberpruefung" },
    { label: "Ungelesene Chats", value: unreadChats, meta: unreadMsgs ? `${unreadMsgs} neue Nachricht${unreadMsgs === 1 ? "" : "en"}` : "Alles beantwortet", icon: MessageSquare, to: "/admin/livechat" },
    { label: "Termine heute", value: todayAppts.length, meta: nextToday ? `Nächster: ${nextToday.appointment_time.slice(0, 5)} Uhr` : "Keine Termine heute", icon: CalendarClock, to: "/admin/termine" },
    { label: "Vics ohne Caller", value: unassignedVics, meta: unassignedVics ? "Noch nicht zugewiesen" : "Alle zugewiesen", icon: Inbox, to: "/admin/vics" },
  ];

  const kpis = [
    { label: "Neue Vics (7 Tage)", value: stats.vics[0], prev: stats.vics[1], meta: `${totalVics} Vics gesamt` },
    { label: "Neue Leads (7 Tage)", value: stats.leads[0], prev: stats.leads[1], meta: `${leads.length} Leads gesamt` },
    { label: "Neue Zuweisungen (7 Tage)", value: stats.assignments[0], prev: stats.assignments[1], meta: `${stats.total} Aufträge gesamt` },
    { label: "Hochgeladene Dokumente (7 Tage)", value: stats.docs[0], prev: stats.docs[1], meta: `${totalDocs} Dokumente gesamt` },
  ];

  const dateStr = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-primary" style={{ letterSpacing: "0.08em" }}>Operations Center</p>
          <h2 className="font-display text-2xl font-semibold text-foreground">Tagesübersicht</h2>
          <p className="mt-2 text-sm text-muted-foreground">{dateStr}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/vics")} className="gap-2"><UserPlus className="w-4 h-4" /> Nutzer erstellen</Button>
          <Button onClick={() => navigate("/admin/verifikationen")} className="gap-2"><FilePlus className="w-4 h-4" /> Verifikation erstellen</Button>
        </div>
      </section>

      {/* Jetzt erledigen */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Jetzt erledigen</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {todo.map((t) => {
            const active = !loading && t.value > 0;
            return (
              <button
                key={t.label}
                onClick={() => navigate(t.to)}
                className={cn(
                  "group rounded-lg border p-5 text-left transition-colors",
                  active ? "border-primary/40 bg-accent hover:border-primary" : "border-border bg-card hover:bg-muted/50",
                )}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">{t.label}</span>
                  <t.icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                </div>
                <p className={cn("font-display text-3xl font-semibold tabular-nums", active ? "text-primary" : "text-muted-foreground")}>
                  {loading ? "…" : t.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t.meta}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Kennzahlen */}
      <section className="grid grid-cols-1 overflow-hidden rounded-lg border border-border bg-card shadow-card sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="border-b border-border p-5 sm:border-r lg:border-b-0 lg:last:border-r-0">
            <span className="text-xs font-semibold text-muted-foreground">{k.label}</span>
            <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-foreground">{loading ? "…" : k.value}</p>
            <div className="mt-1 flex flex-col gap-0.5">
              {!loading && <Trend current={k.value} previous={k.prev} />}
              <span className="text-xs text-muted-foreground">{k.meta}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Diagramme */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border px-5 py-4"><CardTitle className="text-base">Aktivität der letzten 14 Tage</CardTitle></CardHeader>
          <CardContent className="p-5">
            <ChartContainer config={activityConfig} className="h-[260px] w-full">
              <BarChart data={activity} margin={{ left: -20, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} interval={1} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="leads" fill="var(--color-leads)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="vics" fill="var(--color-vics)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="assignments" fill="var(--color-assignments)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartContainer>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              {Object.entries(activityConfig).map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: v.color }} />{v.label}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border px-5 py-4"><CardTitle className="text-base">Auftrags-Pipeline</CardTitle></CardHeader>
          <CardContent className="p-5">
            <ChartContainer config={countConfig} className="h-[260px] w-full">
              <BarChart data={pipelineData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={11} width={90} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                  {pipelineData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-4">
            <CardTitle className="text-base">Leads nach Status</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/leads")} className="gap-1 text-primary">Alle <ArrowRight /></Button>
          </CardHeader>
          <CardContent className="p-5">
            <ChartContainer config={leadChartConfig} className="h-[240px] w-full">
              <BarChart data={leadData} margin={{ left: -20, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={0} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="kanzlei" stackId="a" fill="var(--color-kanzlei)" />
                <Bar dataKey="europol" stackId="a" fill="var(--color-europol)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartContainer>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              {(["kanzlei", "europol"] as LeadCampaign[]).map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: leadChartConfig[c].color }} />{CAMPAIGN_META[c].label}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-4">
            <CardTitle className="text-base">Vics ohne Caller</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/vics")} className="gap-1 text-primary">Alle <ArrowRight /></Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <p className="px-5 py-4 text-sm text-muted-foreground">Laden…</p> : noCaller.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">Alle Vics haben einen Caller.</p>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">E-Mail</TableHead>
                  <TableHead className="text-xs">Registriert</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {noCaller.slice(0, 5).map((v) => (
                    <TableRow key={v.id} className="cursor-pointer" onClick={() => navigate(`/admin/vics/${v.id}`)}>
                      <TableCell className="text-sm font-medium">{personName(v)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{v.email ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(v.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-4">
            <CardTitle className="text-base">Caller-Übersicht</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/caller")} className="gap-1 text-primary">Alle <ArrowRight /></Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <p className="px-5 py-4 text-sm text-muted-foreground">Laden…</p> : callers.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">Keine Caller vorhanden.</p>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs">Caller</TableHead>
                  <TableHead className="text-xs text-right">Vics</TableHead>
                  <TableHead className="text-xs text-right">Offene Aufträge</TableHead>
                  <TableHead className="text-xs text-right">Neu (7 Tage)</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {callers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm font-medium">{c.name}</TableCell>
                      <TableCell className="text-sm text-right tabular-nums">{c.vics}</TableCell>
                      <TableCell className="text-sm text-right tabular-nums">{c.open}</TableCell>
                      <TableCell className="text-sm text-right tabular-nums">{c.weekAssignments}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-4">
            <CardTitle className="text-base">Letzte Zuweisungen</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/verifikationen")} className="gap-1 text-primary">Alle <ArrowRight /></Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <p className="px-5 py-4 text-sm text-muted-foreground">Laden…</p> : recent.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">Keine Zuweisungen vorhanden.</p>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs">Datum</TableHead>
                  <TableHead className="text-xs">Nutzer</TableHead>
                  <TableHead className="text-xs">Auftrag</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {recent.map((a) => (
                    <TableRow key={a.id} className="cursor-pointer" onClick={() => navigate(`/admin/vics/${a.user_id}`)}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(a.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell className="text-sm">{a.userName}</TableCell>
                      <TableCell className="text-sm">{a.verificationTitle}</TableCell>
                      <TableCell><AssignmentStatusBadge status={a.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
