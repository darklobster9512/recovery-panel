import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AssignmentStatusBadge, type AssignmentStatus } from "@/components/AssignmentStatusBadge";
import { Users, Clock, Loader2, CheckCircle2, UserPlus, FilePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StatCard {
  label: string;
  value: number | null;
  icon: React.ElementType;
  className: string;
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
    { label: "Gesamt Vics", value: vicCount, icon: Users, className: "text-blue-600 bg-blue-50" },
    { label: "Offen", value: openCount, icon: Clock, className: "text-yellow-600 bg-yellow-50" },
    { label: "In Bearbeitung", value: progressCount, icon: Loader2, className: "text-blue-600 bg-blue-50" },
    { label: "Abgeschlossen", value: doneCount, icon: CheckCircle2, className: "text-green-600 bg-green-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="border-gray-200 shadow-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{s.label}</CardTitle>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.className}`}>
                <s.icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{loading ? "…" : s.value ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/vics")} className="gap-2">
          <UserPlus className="w-4 h-4" /> Nutzer erstellen
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/verifikationen")} className="gap-2">
          <FilePlus className="w-4 h-4" /> Verifikation erstellen
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assignments */}
        <Card className="border-gray-200 shadow-none bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Letzte Zuweisungen</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="text-sm text-gray-400 px-6 pb-4">Laden…</p>
            ) : recentAssignments.length === 0 ? (
              <p className="text-sm text-gray-400 px-6 pb-4">Keine Zuweisungen vorhanden.</p>
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
                      <TableCell className="text-xs text-gray-500">{formatDate(a.created_at)}</TableCell>
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
        <Card className="border-gray-200 shadow-none bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Letzte SMS</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="text-sm text-gray-400 px-6 pb-4">Laden…</p>
            ) : recentSms.length === 0 ? (
              <p className="text-sm text-gray-400 px-6 pb-4">Keine SMS vorhanden.</p>
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
                      <TableCell className="text-xs text-gray-500">{formatDate(s.created_at)}</TableCell>
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
