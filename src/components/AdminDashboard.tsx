import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AssignmentStatusBadge, type AssignmentStatus } from "@/components/AssignmentStatusBadge";
import { Users, Clock, Loader2, CheckCircle2, UserPlus, FilePlus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StatCard {
  label: string;
  value: number | null;
  icon: React.ElementType;
  meta: string;
}

interface RecentAssignment {
  id: string;
  user_id: string;
  verification_id: string;
  status: AssignmentStatus;
  created_at: string;
  userName: string;
  verificationTitle: string;
}

interface RecentSms {
  id: string;
  recipient: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vicCount, setVicCount] = useState<number | null>(null);
  const [openCount, setOpenCount] = useState<number | null>(null);
  const [progressCount, setProgressCount] = useState<number | null>(null);
  const [doneCount, setDoneCount] = useState<number | null>(null);
  const [recentAssignments, setRecentAssignments] = useState<RecentAssignment[]>([]);
  const [recentSms, setRecentSms] = useState<RecentSms[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [vics, assignments, sms] = await Promise.all([
      supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "user"),
      supabase.from("verification_assignments").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("sms_spoof_history").select("*").order("created_at", { ascending: false }).limit(5),
    ]);

    setVicCount(vics.count ?? 0);
    setRecentSms((sms.data ?? []) as RecentSms[]);

    const allAssignments = (assignments.data ?? []) as Array<{
      id: string; user_id: string; verification_id: string;
      status: AssignmentStatus; created_at: string;
    }>;

    setOpenCount(allAssignments.filter(a => a.status === "zugewiesen").length);
    setProgressCount(allAssignments.filter(a => a.status === "in_bearbeitung").length);
    setDoneCount(allAssignments.filter(a => a.status === "abgeschlossen").length);

    // Enrich recent 5
    const recent5 = allAssignments.slice(0, 5);
    if (recent5.length > 0) {
      const userIds = [...new Set(recent5.map(a => a.user_id))];
      const verIds = [...new Set(recent5.map(a => a.verification_id))];
      const [profiles, verifications] = await Promise.all([
        supabase.from("profiles").select("id, first_name, last_name, email").in("id", userIds),
        supabase.from("verifications").select("id, title").in("id", verIds),
      ]);
      const profileMap = Object.fromEntries((profiles.data ?? []).map(p => [p.id, p]));
      const verMap = Object.fromEntries((verifications.data ?? []).map(v => [v.id, v]));

      setRecentAssignments(recent5.map(a => {
        const p = profileMap[a.user_id];
        const v = verMap[a.verification_id];
        return {
          ...a,
          userName: p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email || "—" : "—",
          verificationTitle: v?.title ?? "—",
        };
      }));
    }

    setLoading(false);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  const stats: StatCard[] = [
    { label: "Gesamt Vics", value: vicCount, icon: Users, meta: "Registrierte Nutzer" },
    { label: "Offene Aufträge", value: openCount, icon: Clock, meta: "Noch nicht begonnen" },
    { label: "In Bearbeitung", value: progressCount, icon: Loader2, meta: "Aktive Vorgänge" },
    { label: "Abgeschlossen", value: doneCount, icon: CheckCircle2, meta: "Erfolgreich erledigt" },
  ];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-primary" style={{ letterSpacing: "0.08em" }}>Operations Center</p>
          <h2 className="font-display text-2xl font-semibold text-foreground">Tagesübersicht</h2>
          <p className="mt-2 text-sm text-muted-foreground">Aktueller Stand der Nutzer- und Verifikationsprozesse.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/vics")} className="gap-2">
            <UserPlus className="w-4 h-4" /> Nutzer erstellen
          </Button>
          <Button onClick={() => navigate("/admin/verifikationen")} className="gap-2">
            <FilePlus className="w-4 h-4" /> Verifikation erstellen
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-border bg-card shadow-card sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="border-b border-border p-5 last:border-b-0 sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:border-r lg:last:border-r-0">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">{s.label}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-primary">
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="font-display text-3xl font-semibold tabular-nums text-foreground">{loading ? "…" : s.value ?? 0}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.meta}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assignments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-4">
            <CardTitle className="text-base">Letzte Zuweisungen</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/verifikationen")} className="gap-1 text-primary">Alle anzeigen <ArrowRight /></Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="text-sm text-muted-foreground px-6 pb-4">Laden…</p>
            ) : recentAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 pb-4">Keine Zuweisungen vorhanden.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Datum</TableHead>
                    <TableHead className="text-xs">Nutzer</TableHead>
                    <TableHead className="text-xs">Auftrag</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAssignments.map(a => (
                    <TableRow
                      key={a.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/admin/vics/${a.user_id}`)}
                    >
                      <TableCell className="text-xs text-muted-foreground">{formatDate(a.created_at)}</TableCell>
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

        {/* Recent SMS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-4">
            <CardTitle className="text-base">Letzte SMS</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/telefonnummern")} className="gap-1 text-primary">Alle anzeigen <ArrowRight /></Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="text-sm text-muted-foreground px-6 pb-4">Laden…</p>
            ) : recentSms.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 pb-4">Keine SMS vorhanden.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Datum</TableHead>
                    <TableHead className="text-xs">Empfänger</TableHead>
                    <TableHead className="text-xs">Absender</TableHead>
                    <TableHead className="text-xs">Nachricht</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSms.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(s.created_at)}</TableCell>
                      <TableCell className="text-sm">{s.recipient}</TableCell>
                      <TableCell className="text-sm">{s.sender_id}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{s.message}</TableCell>
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
