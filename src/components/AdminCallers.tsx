import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Loader2, RefreshCw, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DialogShellHeader, DialogSection, DialogFooterBar } from "@/components/admin/DialogShell";

interface Caller {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  temp_password: string | null;
  avatar_url: string | null;
  created_at: string;
}

const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
function generatePassword(len = 10): string {
  const buf = new Uint32Array(len);
  crypto.getRandomValues(buf);
  let out = "";
  for (let i = 0; i < len; i++) out += CHARS[buf[i] % CHARS.length];
  return out;
}

export default function AdminCallers() {
  const { toast } = useToast();
  const [callers, setCallers] = useState<Caller[]>([]);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [password, setPassword] = useState(() => generatePassword());
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "caller");
    const ids = (roles ?? []).map((r) => r.user_id);
    if (ids.length === 0) {
      setCallers([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, phone, temp_password, avatar_url, created_at")
      .in("id", ids)
      .order("created_at", { ascending: false });
    const list = (data as Caller[]) ?? [];
    setCallers(list);

    // Sign avatar URLs
    const urlMap: Record<string, string> = {};
    await Promise.all(
      list
        .filter((c) => c.avatar_url)
        .map(async (c) => {
          const { data: signed } = await supabase.storage
            .from("caller-avatars")
            .createSignedUrl(c.avatar_url!, 3600);
          if (signed?.signedUrl) urlMap[c.id] = signed.signedUrl;
        }),
    );
    setAvatarUrls(urlMap);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm({ first_name: "", last_name: "", email: "", phone: "" });
    setPassword(generatePassword());
    setAvatarFile(null);
    setOpen(true);
  };

  const handleCreate = async () => {
    if (!form.first_name || !form.last_name || !form.email) {
      toast({ title: "Bitte alle Pflichtfelder ausfüllen.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await supabase.functions.invoke("create-user", {
        body: {
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone || null,
          password,
          role: "caller",
        },
      });
      if (res.error) throw new Error(res.error.message);
      const result: any = res.data;
      if (result?.error) throw new Error(result.error);

      // Upload avatar
      if (avatarFile && result?.id) {
        const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "png";
        const path = `${result.id}/avatar.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("caller-avatars")
          .upload(path, avatarFile, { upsert: true });
        if (!upErr) {
          await supabase.from("profiles").update({ avatar_url: path }).eq("id", result.id);
        }
      }

      toast({ title: "Caller erstellt", description: `Passwort: ${password}` });
      setOpen(false);
      load();
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-primary" style={{ letterSpacing: "0.08em" }}>Vertrieb</p>
          <h2 className="font-display text-2xl font-semibold">Caller</h2>
          <p className="mt-2 text-sm text-muted-foreground">Konten für Ansprechpartner erstellen und verwalten.</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <UserPlus className="w-4 h-4" /> Caller erstellen
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : callers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">Noch keine Caller vorhanden.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Passwort</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {callers.map((c) => {
                  const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={avatarUrls[c.id]} />
                          <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell>{c.email ?? "—"}</TableCell>
                      <TableCell>{c.phone ?? "—"}</TableCell>
                      <TableCell>
                        {c.temp_password ? (
                          <span className="inline-flex items-center gap-1.5">
                            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{c.temp_password}</code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(c.temp_password!);
                                toast({ title: "Kopiert" });
                              }}
                            >
                              <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                            </button>
                          </span>
                        ) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-6 gap-0">
          <DialogHeader className="space-y-0">
            <DialogShellHeader
              icon={<UserPlus className="w-5 h-5" />}
              eyebrow="Caller anlegen"
              title={<DialogTitle asChild><span>Neuen Caller erstellen</span></DialogTitle>}
              description="Callers sehen nur Leads und Vics, die ihnen zugewiesen wurden."
            />
          </DialogHeader>

          <div className="space-y-6 py-6">
            <DialogSection label="Persönliche Angaben">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Vorname *</Label>
                  <Input value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nachname *</Label>
                  <Input value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefon</Label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
            </DialogSection>

            <DialogSection label="Zugangsdaten">
              <div className="flex items-center gap-2">
                <Input value={password} readOnly className="font-mono" />
                <Button type="button" variant="outline" size="icon" onClick={() => setPassword(generatePassword())}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </DialogSection>

            <DialogSection label="Profilbild" hint="Optional">
              <Input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              />
              {avatarFile && <p className="text-xs text-muted-foreground mt-2">{avatarFile.name}</p>}
            </DialogSection>
          </div>

          <DialogFooterBar>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Abbrechen</Button>
            <Button onClick={handleCreate} disabled={submitting} className="gap-2 min-w-[140px]">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Erstellt…</> : <><UserPlus className="w-4 h-4" /> Caller erstellen</>}
            </Button>
          </DialogFooterBar>
        </DialogContent>
      </Dialog>
    </div>
  );
}
