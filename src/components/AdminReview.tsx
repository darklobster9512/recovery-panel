import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AssignmentStatusBadge } from "@/components/AssignmentStatusBadge";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReviewRow {
  id: string;
  user_id: string;
  verification_id: string;
  created_at: string;
  userName: string;
  verificationTitle: string;
}

export default function AdminReview() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: assignments } = await supabase
      .from("verification_assignments")
      .select("id, user_id, verification_id, created_at, status")
      .eq("status", "in_ueberpruefung" as any)
      .order("created_at", { ascending: false });

    if (!assignments || assignments.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(assignments.map((a) => a.user_id))];
    const verIds = [...new Set(assignments.map((a) => a.verification_id))];

    const [{ data: profiles }, { data: verifications }] = await Promise.all([
      supabase.from("profiles").select("id, first_name, last_name, email").in("id", userIds),
      supabase.from("verifications").select("id, title").in("id", verIds),
    ]);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);
    const verMap = new Map(verifications?.map((v) => [v.id, v]) ?? []);

    setRows(
      assignments.map((a) => {
        const p = profileMap.get(a.user_id);
        const name = p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || a.user_id : a.user_id;
        return {
          id: a.id,
          user_id: a.user_id,
          verification_id: a.verification_id,
          created_at: a.created_at,
          userName: name,
          verificationTitle: verMap.get(a.verification_id)?.title ?? a.verification_id,
        };
      })
    );
    setLoading(false);
  };

  const handleAction = async (id: string, newStatus: "genehmigt" | "abgelehnt") => {
    setActionLoading(id);
    const { error } = await supabase
      .from("verification_assignments")
      .update({ status: newStatus as any })
      .eq("id", id);

    if (error) {
      toast.error("Fehler: " + error.message);
    } else {
      toast.success(newStatus === "genehmigt" ? "Auftrag genehmigt" : "Auftrag abgelehnt");
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
    setActionLoading(null);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground text-sm">
        Keine Aufträge zur Überprüfung vorhanden.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nutzer</TableHead>
            <TableHead>Auftrag</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.userName}</TableCell>
              <TableCell>{row.verificationTitle}</TableCell>
              <TableCell>{formatDate(row.created_at)}</TableCell>
              <TableCell>
                <AssignmentStatusBadge status="in_ueberpruefung" />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                    disabled={actionLoading === row.id}
                    onClick={() => handleAction(row.id, "genehmigt")}
                  >
                    {actionLoading === row.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    )}
                    Genehmigen
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    disabled={actionLoading === row.id}
                    onClick={() => handleAction(row.id, "abgelehnt")}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Ablehnen
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
