import { useEffect, useRef, useState, useCallback } from "react";
import { MessageCircle, X, Send, Paperclip, Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadChatAttachment, signChatAttachment } from "./uploadChatAttachment";

interface Contact {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null; // signed URL
}

interface Msg {
  id: string;
  vic_id: string;
  sender_role: "vic" | "caller" | "admin" | "system";
  content: string;
  attachment_url: string | null;
  attachment_type: string | null;
  read_at_vic: string | null;
  created_at: string;
}

interface Props {
  contact: Contact | null;
  fallbackName: string;
  locked?: boolean;
  lockedMessage?: string;
  vicName?: string;
  vicEmail?: string;
}

export default function ChatWidget({ contact, fallbackName, locked, lockedMessage, vicName, vicEmail }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [attachments, setAttachments] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const displayName = contact
    ? [contact.first_name, contact.last_name].filter(Boolean).join(" ") || fallbackName
    : fallbackName;
  const initials = displayName.split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  const loadMessages = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("vic_id", user.id)
      .order("created_at", { ascending: true });
    const rows = (data ?? []) as Msg[];
    setMessages(rows);
    setUnread(rows.filter((m) => m.sender_role !== "vic" && !m.read_at_vic).length);
    for (const m of rows) {
      if (m.attachment_url && !attachments[m.attachment_url]) {
        const url = await signChatAttachment(m.attachment_url);
        if (url) setAttachments((prev) => ({ ...prev, [m.attachment_url as string]: url }));
      }
    }
  }, [user, attachments]);

  useEffect(() => {
    if (!user) return;
    loadMessages();
    const channel = supabase
      .channel(`chat:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `vic_id=eq.${user.id}` },
        () => loadMessages()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    if (!open || !user || unread === 0) return;
    supabase
      .from("chat_messages")
      .update({ read_at_vic: new Date().toISOString() })
      .eq("vic_id", user.id)
      .is("read_at_vic", null)
      .neq("sender_role", "vic")
      .then(() => setUnread(0));
  }, [open, user, unread]);

  const send = async () => {
    if (!user || (!input.trim() && !fileRef.current?.files?.length) || sending) return;
    setSending(true);
    try {
      let attachment_url: string | null = null;
      let attachment_type: string | null = null;
      const file = fileRef.current?.files?.[0];
      if (file) {
        const up = await uploadChatAttachment(user.id, file);
        attachment_url = up.path;
        attachment_type = up.type;
      }
      const text = input.trim();
      const { error } = await supabase.from("chat_messages").insert({
        vic_id: user.id,
        sender_role: "vic",
        sender_user_id: user.id,
        content: text,
        attachment_url,
        attachment_type,
      });
      if (error) throw error;
      setInput("");
      if (fileRef.current) fileRef.current.value = "";
      void notifyTelegram("chat_message_received", {
        vic_name: vicName || vicEmail || "Unbekannt",
        vic_email: vicEmail,
        preview: text || (attachment_url ? "[Datei]" : ""),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 rounded-full bg-[#0b1f3a] text-white shadow-xl w-14 h-14 flex items-center justify-center hover:bg-[#0b1f3a]/90 transition"
          aria-label="Chat öffnen"
        >
          <MessageCircle className="w-6 h-6" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#c9a24a] text-[#0b1f3a] text-xs font-bold flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>
      )}
      {open && (
        <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-5 sm:right-5 z-40 w-full sm:w-[380px] h-[85vh] sm:h-[560px] bg-white sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#0b1f3a] text-white">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 border border-white/20 shrink-0 flex items-center justify-center">
              {contact?.avatar_url ? (
                <img src={contact.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold">{initials || "KP"}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{displayName}</p>
              <p className="text-[11px] text-white/70">Ihr Ansprechpartner</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white p-1" aria-label="Schließen">
              <X className="w-5 h-5" />
            </button>
          </div>

          {locked ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center text-slate-600">
              <Lock className="w-10 h-10 text-slate-400" />
              <p className="text-sm">{lockedMessage ?? "Chat wird nach Verifizierung freigeschaltet."}</p>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-slate-50">
                {messages.length === 0 && (
                  <p className="text-center text-xs text-slate-500 mt-6">
                    Schreiben Sie Ihrem Ansprechpartner eine Nachricht.
                  </p>
                )}
                {messages.map((m) => {
                  const mine = m.sender_role === "vic";
                  return (
                    <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
                        mine ? "bg-[#0b1f3a] text-white" : "bg-white border border-slate-200 text-slate-800"
                      )}>
                        {m.content}
                        {m.attachment_url && attachments[m.attachment_url] && (
                          <div className="mt-2">
                            {m.attachment_type?.startsWith("image/") ? (
                              <a href={attachments[m.attachment_url]} target="_blank" rel="noreferrer">
                                <img src={attachments[m.attachment_url]} className="max-w-full rounded-lg" />
                              </a>
                            ) : (
                              <a
                                href={attachments[m.attachment_url]}
                                target="_blank"
                                rel="noreferrer"
                                className={cn("underline text-xs", mine ? "text-white/90" : "text-[#0b1f3a]")}
                              >
                                Datei öffnen
                              </a>
                            )}
                          </div>
                        )}
                        <div className={cn("text-[10px] mt-1 opacity-70", mine ? "text-white" : "text-slate-500")}>
                          {new Date(m.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-3 border-t border-slate-200 bg-white">
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                    aria-label="Datei anhängen"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" />
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    placeholder="Nachricht schreiben…"
                    className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0b1f3a]/20 max-h-32"
                  />
                  <Button onClick={send} disabled={sending} className="bg-[#0b1f3a] hover:bg-[#0b1f3a]/90 h-9 px-3">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
