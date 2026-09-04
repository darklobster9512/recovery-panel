import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Send, Paperclip, Loader2, MessageCircle, Search, Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadChatAttachment, signChatAttachment } from "@/components/chat/uploadChatAttachment";

interface Msg {
  id: string;
  vic_id: string;
  sender_role: "vic" | "caller" | "admin" | "system";
  sender_user_id: string | null;
  as_caller_id: string | null;
  content: string;
  attachment_url: string | null;
  attachment_type: string | null;
  read_at_vic: string | null;
  read_at_team: string | null;
  created_at: string;
}

interface Conv {
  vic_id: string;
  name: string;
  email: string;
  assigned_caller_id: string | null;
  lastAt: string | null;
  lastText: string;
  unread: number;
}

interface CallerOpt {
  id: string;
  name: string;
}

interface Template {
  id: string;
  shortcode: string;
  content: string;
}

export default function AdminLivechat() {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const [convs, setConvs] = useState<Conv[]>([]);
  const [callers, setCallers] = useState<CallerOpt[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [attachments, setAttachments] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [asCallerId, setAsCallerId] = useState<string>("self");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tplOpen, setTplOpen] = useState(false);
  const [newShort, setNewShort] = useState("");
  const [newContent, setNewContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const active = convs.find((c) => c.vic_id === activeId) ?? null;

  const loadConvs = useCallback(async () => {
    const { data: roleRows } = await supabase.from("user_roles").select("user_id").eq("role", "user");
    const vicIds = (roleRows ?? []).map((r: any) => r.user_id);
    if (vicIds.length === 0) { setConvs([]); setLoading(false); return; }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, assigned_caller_id")
      .in("id", vicIds);

    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("vic_id, content, created_at, sender_role, read_at_team")
      .order("created_at", { ascending: false });

    const byVic = new Map<string, { lastAt: string; lastText: string; unread: number }>();
    for (const m of (msgs ?? []) as any[]) {
      const cur = byVic.get(m.vic_id);
      if (!cur) {
        byVic.set(m.vic_id, {
          lastAt: m.created_at,
          lastText: m.content || "[Datei]",
          unread: m.sender_role === "vic" && !m.read_at_team ? 1 : 0,
        });
      } else if (m.sender_role === "vic" && !m.read_at_team) {
        cur.unread += 1;
      }
    }

    const filteredProfiles = isAdmin
      ? (profiles ?? [])
      : (profiles ?? []).filter((p: any) => p.assigned_caller_id === user?.id);
    const list: Conv[] = filteredProfiles.map((p: any) => {
      const agg = byVic.get(p.id);
      return {
        vic_id: p.id,
        name: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "Unbekannt",
        email: p.email ?? "",
        assigned_caller_id: p.assigned_caller_id ?? null,
        lastAt: agg?.lastAt ?? null,
        lastText: agg?.lastText ?? "",
        unread: agg?.unread ?? 0,
      };
    });
    list.sort((a, b) => {
      if (a.lastAt && b.lastAt) return b.lastAt.localeCompare(a.lastAt);
      if (a.lastAt) return -1;
      if (b.lastAt) return 1;
      return a.name.localeCompare(b.name);
    });
    setConvs(list);
    setLoading(false);
  }, [isAdmin, user?.id]);

  const loadCallers = useCallback(async () => {
    const { data: roleRows } = await supabase.from("user_roles").select("user_id").eq("role", "caller");
    const ids = (roleRows ?? []).map((r: any) => r.user_id);
    if (ids.length === 0) { setCallers([]); return; }
    const { data } = await supabase.from("profiles").select("id, first_name, last_name, email").in("id", ids);
    setCallers((data ?? []).map((p: any) => ({
      id: p.id,
      name: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "Caller",
    })));
  }, []);

  const loadTemplates = useCallback(async () => {
    const { data } = await supabase.from("chat_templates").select("*").order("shortcode");
    setTemplates((data ?? []) as Template[]);
  }, []);

  useEffect(() => {
    loadConvs();
    loadCallers();
    loadTemplates();
  }, [loadConvs, loadCallers, loadTemplates]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => {
        loadConvs();
        if (activeId) loadMessages(activeId);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const loadMessages = useCallback(async (vicId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("vic_id", vicId)
      .order("created_at", { ascending: true });
    const rows = (data ?? []) as Msg[];
    setMessages(rows);
    for (const m of rows) {
      if (m.attachment_url) {
        const url = await signChatAttachment(m.attachment_url);
        if (url) setAttachments((prev) => ({ ...prev, [m.attachment_url as string]: url }));
      }
    }
    await supabase
      .from("chat_messages")
      .update({ read_at_team: new Date().toISOString() })
      .eq("vic_id", vicId)
      .eq("sender_role", "vic")
      .is("read_at_team", null);
    setConvs((prev) => prev.map((c) => (c.vic_id === vicId ? { ...c, unread: 0 } : c)));
  }, []);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
  }, [activeId, loadMessages]);

  useEffect(() => {
    if (!active) return;
    setAsCallerId(isAdmin ? (active.assigned_caller_id ?? "self") : "self");
  }, [active?.vic_id, active?.assigned_caller_id, isAdmin]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    if (!user || !activeId || sending) return;
    const file = fileRef.current?.files?.[0];
    const text = input.trim();
    if (!text && !file) return;
    setSending(true);
    try {
      let attachment_url: string | null = null;
      let attachment_type: string | null = null;
      if (file) {
        const up = await uploadChatAttachment(activeId, file);
        attachment_url = up.path;
        attachment_type = up.type;
      }
      const { error } = await supabase.from("chat_messages").insert({
        vic_id: activeId,
        sender_role: isAdmin ? "admin" : "caller",
        sender_user_id: user.id,
        as_caller_id: isAdmin && asCallerId !== "self" ? asCallerId : null,
        content: text,
        attachment_url,
        attachment_type,
      });
      if (error) throw error;
      setInput("");
      if (fileRef.current) fileRef.current.value = "";
      await loadMessages(activeId);
      loadConvs();
    } catch (e: any) {
      toast.error(e?.message ?? "Senden fehlgeschlagen");
    } finally {
      setSending(false);
    }
  };

  const addTemplate = async () => {
    if (!newShort.trim() || !newContent.trim()) return;
    const { error } = await supabase.from("chat_templates").insert({
      shortcode: newShort.trim(),
      content: newContent.trim(),
      created_by: user?.id ?? null,
    });
    if (error) { toast.error(error.message); return; }
    setNewShort(""); setNewContent("");
    loadTemplates();
    toast.success("Vorlage gespeichert");
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from("chat_templates").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    loadTemplates();
  };

  const filtered = convs.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  const callerName = (id: string | null) => callers.find((c) => c.id === id)?.name ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-9rem)]">
      {/* Conversation list */}
      <Card className="flex flex-col overflow-hidden">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Vic suchen…"
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          )}
          {!loading && filtered.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground text-center">Keine Vics gefunden.</p>
          )}
          {filtered.map((c) => (
            <button
              key={c.vic_id}
              type="button"
              onClick={() => setActiveId(c.vic_id)}
              className={cn(
                "w-full text-left px-3 py-2.5 border-b hover:bg-muted/60 transition",
                activeId === c.vic_id && "bg-muted"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">{c.name}</span>
                {c.unread > 0 && <Badge className="shrink-0">{c.unread}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground truncate">{c.lastText || c.email}</p>
              {isAdmin && (
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {callerName(c.assigned_caller_id) ?? "Dr. Thomas Korte (Kanzlei)"}
                </p>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Chat */}
      <Card className="flex flex-col overflow-hidden">
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <MessageCircle className="w-8 h-8" />
            <p className="text-sm">Wählen Sie links einen Chat aus.</p>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{active.name}</p>
                <p className="text-xs text-muted-foreground truncate">{active.email}</p>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Antworten als</span>
                  <Select value={asCallerId} onValueChange={setAsCallerId}>
                    <SelectTrigger className="w-[190px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">Dr. Thomas Korte (Kanzlei)</SelectItem>
                      {callers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-muted/30">
              {messages.length === 0 && (
                <p className="text-center text-xs text-muted-foreground mt-6">Noch keine Nachrichten.</p>
              )}
              {messages.map((m) => {
                const mine = m.sender_role !== "vic";
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[70%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
                      mine ? "bg-primary text-primary-foreground" : "bg-background border"
                    )}>
                      {mine && (
                        <div className="text-[10px] opacity-75 mb-0.5">
                          {m.as_caller_id
                            ? `${callerName(m.as_caller_id) ?? "Caller"} (im Namen)`
                            : m.sender_role === "admin" ? "Admin" : callerName(m.sender_user_id) ?? "Caller"}
                        </div>
                      )}
                      {m.content}
                      {m.attachment_url && attachments[m.attachment_url] && (
                        <div className="mt-2">
                          {m.attachment_type?.startsWith("image/") ? (
                            <a href={attachments[m.attachment_url]} target="_blank" rel="noreferrer">
                              <img src={attachments[m.attachment_url]} className="max-w-full rounded-lg" />
                            </a>
                          ) : (
                            <a href={attachments[m.attachment_url]} target="_blank" rel="noreferrer" className="underline text-xs">
                              Datei öffnen
                            </a>
                          )}
                        </div>
                      )}
                      <div className="text-[10px] mt-1 opacity-70">
                        {new Date(m.created_at).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {templates.slice(0, 6).map((t) => (
                  <Button
                    key={t.id}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setInput((prev) => (prev ? prev + " " : "") + t.content)}
                  >
                    {t.shortcode}
                  </Button>
                ))}
                {isAdmin && (
                  <Dialog open={tplOpen} onOpenChange={setTplOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        <FileText className="w-3.5 h-3.5 mr-1" /> Vorlagen
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Chat-Vorlagen</DialogTitle></DialogHeader>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {templates.map((t) => (
                          <div key={t.id} className="flex items-start gap-2 border rounded-md p-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold">{t.shortcode}</p>
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{t.content}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => deleteTemplate(t.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        {templates.length === 0 && <p className="text-xs text-muted-foreground">Noch keine Vorlagen.</p>}
                      </div>
                      <div className="space-y-2 pt-2 border-t">
                        <Input value={newShort} onChange={(e) => setNewShort(e.target.value)} placeholder="Kürzel, z.B. begruessung" />
                        <Textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Nachrichtentext" rows={3} />
                      </div>
                      <DialogFooter>
                        <Button onClick={addTemplate}><Plus className="w-4 h-4 mr-1" /> Hinzufügen</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
                  aria-label="Datei anhängen"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" />
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                  }}
                  rows={2}
                  placeholder="Nachricht schreiben…"
                  className="flex-1 resize-none"
                />
                <Button onClick={send} disabled={sending}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
