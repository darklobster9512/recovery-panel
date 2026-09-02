import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { formatDateTime, type LeadNote } from "@/lib/leads";

interface Props {
  leadId: string;
  onSaved?: () => void;
  className?: string;
}

export default function LeadNotesPanel({ leadId, onSaved, className }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [authors, setAuthors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("lead_notes")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true });
    if (error) {
      toast({ title: "Notizen konnten nicht geladen werden", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const list = (data ?? []) as LeadNote[];
    setNotes(list);

    const ids = [...new Set(list.map((n) => n.author_id).filter(Boolean))] as string[];
    if (ids.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("id, email").in("id", ids);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p: { id: string; email: string | null }) => {
        map[p.id] = p.email ?? "Unbekannt";
      });
      setAuthors(map);
    }
    setLoading(false);
  }, [leadId, toast]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const handleSave = async () => {
    const text = content.trim();
    if (!text) return;
    setSaving(true);
    const { error } = await supabase.from("lead_notes").insert({
      lead_id: leadId,
      author_id: user?.id ?? null,
      content: text,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Notiz nicht gespeichert", description: error.message, variant: "destructive" });
      return;
    }
    setContent("");
    await load();
    onSaved?.();
  };

  return (
    <div className={className}>
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1 mb-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Lädt…
          </div>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Notizen.</p>
        ) : (
          notes.map((n) => {
            const mine = n.author_id === user?.id;
            return (
              <div key={n.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    mine
                      ? "bg-[hsl(221,100%,50%)] text-white rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{n.content}</p>
                  <p className={`mt-1 text-[11px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {(n.author_id ? authors[n.author_id] : null) ?? "Unbekannt"} ·{" "}
                    {formatDateTime(n.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Notiz schreiben…"
          rows={3}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={saving || !content.trim()}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Notiz speichern
          </Button>
        </div>
      </div>
    </div>
  );
}
