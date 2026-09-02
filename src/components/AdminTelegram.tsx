import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Send, Trash2, Info } from "lucide-react";
import { notifyTelegram, type TelegramDbEvent } from "@/lib/telegramNotify";

interface TelegramChat {
  id: string;
  chat_id: string;
  label: string;
  created_at: string;
}

interface Subscription {
  id: string;
  chat_id: string; // FK to telegram_chats.id
  event: TelegramDbEvent;
  enabled: boolean;
}

const EVENTS: { key: TelegramDbEvent; label: string }[] = [
  { key: "lead_note_added", label: "Lead-Notiz" },
  { key: "vic_note_added", label: "Vic-Notiz" },
  { key: "document_uploaded", label: "Dokument-Upload" },
  { key: "assignment_created", label: "Auftrag zugewiesen" },
  { key: "assignment_completed", label: "Auftrag abgeschlossen" },
  { key: "anosim_sms_received", label: "SMS eingegangen" },
  { key: "user_account_created", label: "Nutzerkonto erstellt" },
  { key: "tan_forwarded_to_vic", label: "TAN weitergeleitet" },
];

export default function AdminTelegram() {
  const { toast } = useToast();
  const [chats, setChats] = useState<TelegramChat[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newChatId, setNewChatId] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: s }] = await Promise.all([
      supabase.from("telegram_chats").select("*").order("created_at"),
      supabase.from("telegram_notification_subscriptions").select("*"),
    ]);
    setChats((c ?? []) as TelegramChat[]);
    setSubs((s ?? []) as Subscription[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const isSubscribed = (chatUuid: string, event: TelegramDbEvent) =>
    subs.some((s) => s.chat_id === chatUuid && s.event === event && s.enabled);

  const toggleSub = async (chatUuid: string, event: TelegramDbEvent, enabled: boolean) => {
    // optimistic UI
    const existing = subs.find((s) => s.chat_id === chatUuid && s.event === event);
    if (existing) {
      setSubs((prev) =>
        prev.map((s) => (s.id === existing.id ? { ...s, enabled } : s))
      );
      const { error } = await supabase
        .from("telegram_notification_subscriptions")
        .update({ enabled })
        .eq("id", existing.id);
      if (error) {
        toast({ title: "Speichern fehlgeschlagen", description: error.message, variant: "destructive" });
        load();
      }
    } else {
      const { data, error } = await supabase
        .from("telegram_notification_subscriptions")
        .insert({ chat_id: chatUuid, event, enabled })
        .select()
        .single();
      if (error) {
        toast({ title: "Speichern fehlgeschlagen", description: error.message, variant: "destructive" });
      } else if (data) {
        setSubs((prev) => [...prev, data as Subscription]);
      }
    }
  };

  const handleAdd = async () => {
    const label = newLabel.trim();
    const chatId = newChatId.trim();
    if (!label || !chatId) return;
    setSaving(true);
    const { error } = await supabase
      .from("telegram_chats")
      .insert({ label, chat_id: chatId });
    setSaving(false);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Chat hinzugefügt" });
    setNewLabel("");
    setNewChatId("");
    setAddOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Chat wirklich entfernen? Alle Abonnements werden ebenfalls gelöscht.")) return;
    const { error } = await supabase.from("telegram_chats").delete().eq("id", id);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  const handleTest = async (chatId: string) => {
    await notifyTelegram("test", {}, { chatIdOverride: chatId });
    toast({ title: "Test-Nachricht gesendet", description: `An ${chatId}` });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Info className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-sm font-semibold">So findest du deine Chat-ID</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Schreibe im Telegram-Bot{" "}
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                @userinfobot
              </a>{" "}
              die Nachricht <code>/start</code>. Er antwortet mit deiner numerischen Chat-ID.
              Für Gruppen füge unseren Bot der Gruppe hinzu und nutze <code>@RawDataBot</code>,
              um die Gruppen-Chat-ID (mit Minuszeichen davor) auszulesen.
              Wichtig: der Nutzer/die Gruppe muss dem Bot zuerst <code>/start</code> schicken.
            </p>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Chat-IDs</CardTitle>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Chat hinzufügen
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Lädt…
            </div>
          ) : chats.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              Noch keine Chats hinterlegt.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Chat-ID</TableHead>
                  <TableHead className="w-[180px] text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chats.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.label}</TableCell>
                    <TableCell className="font-mono text-xs">{c.chat_id}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTest(c.chat_id)}
                      >
                        <Send className="mr-1.5 h-3.5 w-3.5" /> Test
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(c.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {chats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Benachrichtigungen zuordnen</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Aktiviere pro Chat, welche Ereignisse eine Telegram-Nachricht auslösen sollen.
            </p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Chat</TableHead>
                  {EVENTS.map((e) => (
                    <TableHead key={e.key} className="text-center text-[11px]">
                      {e.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {chats.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.label}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{c.chat_id}</div>
                    </TableCell>
                    {EVENTS.map((e) => (
                      <TableCell key={e.key} className="text-center">
                        <Switch
                          checked={isSubscribed(c.id, e.key)}
                          onCheckedChange={(v) => toggleSub(c.id, e.key, v)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chat hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="z.B. Team-Gruppe"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Chat-ID</Label>
              <Input
                value={newChatId}
                onChange={(e) => setNewChatId(e.target.value)}
                placeholder="z.B. 123456789 oder -1001234567890"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Abbrechen</Button>
            <Button onClick={handleAdd} disabled={saving || !newLabel || !newChatId}>
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
