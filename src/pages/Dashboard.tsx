import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AssignmentStatusBadge, type AssignmentStatus } from "@/components/AssignmentStatusBadge";
import { LogOut, ArrowLeft, Copy, CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Assignment {
  id: string;
  status: AssignmentStatus;
  field_values: Record<string, string>;
  created_at: string;
  verification_id: string;
  phone_number_id: string | null;
  verification?: {
    title: string;
    logo_url: string | null;
    instructions: string[];
    required_fields: string[];
    appstore_url: string | null;
    playstore_url: string | null;
  };
  phone_number?: string | null;
}

const STATUS_PROGRESS: Record<AssignmentStatus, number> = {
  zugewiesen: 33,
  in_bearbeitung: 66,
  abgeschlossen: 100,
};

const FIELD_LABELS: Record<string, string> = {
  email: "E-Mail",
  password: "Passwort",
  phone: "Telefonnummer",
  username: "Benutzername",
  pin: "PIN",
  code: "Code",
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadAssignments();
  }, [user]);

  const loadAssignments = async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from("verification_assignments")
      .select("id, status, field_values, created_at, verification_id, phone_number_id")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (!rows || rows.length === 0) {
      setAssignments([]);
      setLoading(false);
      return;
    }

    const verificationIds = [...new Set(rows.map((r) => r.verification_id))];
    const { data: verifications } = await supabase
      .from("verifications")
      .select("id, title, logo_url, instructions, required_fields, appstore_url, playstore_url")
      .in("id", verificationIds);

    const vMap = new Map(verifications?.map((v) => [v.id, v]) ?? []);

    // Load phone numbers for assignments that have one
    const phoneIds = rows.filter((r) => r.phone_number_id).map((r) => r.phone_number_id!);
    let phoneMap = new Map<string, string>();
    if (phoneIds.length > 0) {
      const { data: phones } = await supabase
        .from("phone_numbers")
        .select("id, token")
        .in("id", phoneIds);

      if (phones) {
        for (const p of phones) {
          try {
            const { data } = await supabase.functions.invoke("anosim-proxy", {
              body: { token: p.token },
            });
            if (data?.number) {
              phoneMap.set(p.id, data.number);
            }
          } catch {
            // ignore
          }
        }
      }
    }

    const mapped: Assignment[] = rows.map((r) => ({
      id: r.id,
      status: r.status as AssignmentStatus,
      field_values: (r.field_values as Record<string, string>) ?? {},
      created_at: r.created_at,
      verification_id: r.verification_id,
      phone_number_id: r.phone_number_id,
      verification: vMap.get(r.verification_id),
      phone_number: r.phone_number_id ? phoneMap.get(r.phone_number_id) ?? null : null,
    }));

    setAssignments(mapped);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const copyToClipboard = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(key);
    toast.success("Kopiert");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const selected = assignments.find((a) => a.id === selectedId) ?? null;
  const completedCount = assignments.filter((a) => a.status === "abgeschlossen").length;
  const totalProgress = assignments.length > 0
    ? Math.round(assignments.reduce((sum, a) => sum + STATUS_PROGRESS[a.status], 0) / assignments.length)
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-semibold text-foreground tracking-tight">Aufträge</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4 mr-1.5" />
            Abmelden
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : selected ? (
          /* ── Detail View ── */
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedId(null)}
              className="mb-6 text-muted-foreground hover:text-foreground -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Zurück
            </Button>

            <Card className="border-border bg-card shadow-none">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  {selected.verification?.logo_url && (
                    <img
                      src={selected.verification.logo_url}
                      alt=""
                      className="w-10 h-10 rounded-lg object-contain bg-secondary p-1"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold truncate">
                      {selected.verification?.title ?? "Auftrag"}
                    </CardTitle>
                    <div className="mt-1">
                      <AssignmentStatusBadge status={selected.status} />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Fortschritt</span>
                    <span>{STATUS_PROGRESS[selected.status]}%</span>
                  </div>
                  <Progress value={STATUS_PROGRESS[selected.status]} className="h-2" />
                </div>

                {/* App Links */}
                {(selected.verification?.appstore_url || selected.verification?.playstore_url) && (
                  <div className="flex gap-2">
                    {selected.verification.appstore_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selected.verification.appstore_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          App Store
                        </a>
                      </Button>
                    )}
                    {selected.verification.playstore_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selected.verification.playstore_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          Play Store
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                {/* Credentials */}
                {Object.keys(selected.field_values).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3">Zugangsdaten</h3>
                    <div className="space-y-2">
                      {Object.entries(selected.field_values).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-3 py-2.5 group"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">{FIELD_LABELS[key] ?? key}</p>
                            <p className="text-sm font-mono font-medium text-foreground truncate">{value}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyToClipboard(key, value)}
                          >
                            {copiedField === key ? (
                              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phone number */}
                {selected.phone_number && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3">Zugewiesene Telefonnummer</h3>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-3 py-2.5 group">
                      <div>
                        <p className="text-xs text-muted-foreground">Telefonnummer</p>
                        <p className="text-sm font-mono font-medium text-foreground">{selected.phone_number}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard("phone_assigned", selected.phone_number!)}
                      >
                        {copiedField === "phone_assigned" ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                {selected.verification?.instructions && selected.verification.instructions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3">Anleitung</h3>
                    <ol className="space-y-3">
                      {selected.verification.instructions.map((step, i) => (
                        <li key={i} className="flex gap-3 items-start">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-sm text-foreground/80 leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* ── Overview ── */
          <div className="animate-in fade-in slide-in-from-left-4 duration-300">
            {/* Overall progress */}
            {assignments.length > 0 && (
              <Card className="border-border bg-card shadow-none mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Gesamtfortschritt</span>
                    <span className="text-xs text-muted-foreground">
                      {completedCount} von {assignments.length} abgeschlossen
                    </span>
                  </div>
                  <Progress value={totalProgress} className="h-2.5" />
                </CardContent>
              </Card>
            )}

            {assignments.length === 0 ? (
              <Card className="border-border bg-card shadow-none">
                <CardContent className="py-16 text-center">
                  <p className="text-muted-foreground text-sm">Keine Aufträge vorhanden.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {assignments.map((a) => (
                  <Card
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className="border-border bg-card shadow-none cursor-pointer transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 group"
                  >
                    <CardContent className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        {a.verification?.logo_url && (
                          <img
                            src={a.verification.logo_url}
                            alt=""
                            className="w-9 h-9 rounded-lg object-contain bg-secondary p-1 shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {a.verification?.title ?? "Auftrag"}
                            </p>
                            <AssignmentStatusBadge status={a.status} />
                          </div>
                          <Progress value={STATUS_PROGRESS[a.status]} className="h-1.5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
