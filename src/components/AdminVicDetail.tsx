import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Send, Copy, StickyNote } from "lucide-react";

interface VicProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  temp_password: string | null;
  created_at: string;
}

interface UserNote {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
}

export default function AdminVicDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<VicProfile | null>(null);
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);

    const [profileRes, notesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
      supabase.from("user_notes").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    ]);

    setProfile(profileRes.data as VicProfile | null);
    setNotes((notesRes.data as UserNote[]) ?? []);
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
      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">
            {profile.first_name} {profile.last_name}
          </CardTitle>
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

      {/* Notes Section */}
      <Card className="border-border shadow-none">
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
                <div key={note.id} className="rounded-lg border border-border bg-muted/50 p-3">
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(note.created_at).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
