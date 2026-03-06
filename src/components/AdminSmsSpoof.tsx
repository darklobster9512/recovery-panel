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
import { Send, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SmsHistoryEntry {
  id: string;
  recipient: string;
  sender_id: string;
  message: string;
  response: Record<string, unknown> | null;
  created_at: string;
}

export default function AdminSmsSpoof() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [to, setTo] = useState("");
  const [senderID, setSenderID] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [history, setHistory] = useState<SmsHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from("sms_spoof_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) setHistory(data as unknown as SmsHistoryEntry[]);
    setLoadingHistory(false);
  };

  useEffect(() => {
    fetchHistory();
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

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Send Form */}
      <Card className="border-gray-200 shadow-none bg-white">
        <CardHeader>
          <CardTitle className="text-lg">SMS senden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Empfänger</Label>
            <Input
              id="recipient"
              placeholder="z.B. 49170123456"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senderId">Absender-ID</Label>
            <Input
              id="senderId"
              placeholder="z.B. PayPal"
              value={senderID}
              onChange={(e) => setSenderID(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Nachricht</Label>
            <Textarea
              id="message"
              placeholder="SMS-Text eingeben..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
            />
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
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Noch keine SMS gesendet.</p>
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
  );
}
