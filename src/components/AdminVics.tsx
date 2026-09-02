import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Loader2, Copy, Search, Eye, RefreshCw, Check, ChevronsUpDown, KeyRound, User, Wallet } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { DialogShellHeader, DialogSection, DialogFooterBar } from "@/components/admin/DialogShell";

interface VicUser {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  temp_password: string | null;
  created_at: string;
}

interface LeadOption {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
}

const PASSWORD_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const PASSWORD_LENGTH = 8;

function generatePassword(): string {
  const array = new Uint32Array(PASSWORD_LENGTH);
  crypto.getRandomValues(array);
  let pw = "";
  for (let i = 0; i < PASSWORD_LENGTH; i++) {
    pw += PASSWORD_CHARS[array[i] % PASSWORD_CHARS.length];
  }
  return pw;
}

export default function AdminVics() {
  const [users, setUsers] = useState<VicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    balance: "",
    scam_project: "",
  });
  const [password, setPassword] = useState(() => generatePassword());
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [leadPopoverOpen, setLeadPopoverOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "user");

    if (!roles || roles.length === 0) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const userIds = roles.map((r) => r.user_id);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, phone, temp_password, created_at")
      .in("id", userIds)
      .order("created_at", { ascending: false });

    setUsers((profiles as VicUser[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  const newFromLead = searchParams.get("newFromLead");

  useEffect(() => {
    if (!newFromLead) return;
    let cancelled = false;
    (async () => {
      setPassword(generatePassword());
      setForm({ first_name: "", last_name: "", email: "", phone: "", balance: "", scam_project: "" });
      setSelectedLeadId("");
      setLeadsLoading(true);
      const { data } = await supabase
        .from("leads")
        .select("id, full_name, email, phone_number")
        .order("imported_at", { ascending: false })
        .limit(500);
      if (cancelled) return;
      const list = (data as LeadOption[]) ?? [];
      setLeads(list);
      setLeadsLoading(false);
      const lead = list.find((l) => l.id === newFromLead);
      if (lead) {
        const fullName = (lead.full_name || "").trim();
        const parts = fullName.split(/\s+/);
        const firstName = parts.slice(0, -1).join(" ") || fullName;
        const lastName = parts.length > 1 ? parts[parts.length - 1] : "";
        setForm((f) => ({
          ...f,
          first_name: firstName,
          last_name: lastName,
          email: lead.email || "",
          phone: lead.phone_number || "",
        }));
        setSelectedLeadId(newFromLead);
      }
      setDialogOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("newFromLead");
      setSearchParams(next, { replace: true });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newFromLead]);

  const fetchLeads = async () => {
    setLeadsLoading(true);
    const { data } = await supabase
      .from("leads")
      .select("id, full_name, email, phone_number")
      .order("imported_at", { ascending: false })
      .limit(500);
    setLeads((data as LeadOption[]) ?? []);
    setLeadsLoading(false);
  };

  const openDialog = () => {
    setPassword(generatePassword());
    setForm({ first_name: "", last_name: "", email: "", phone: "", balance: "", scam_project: "" });
    setSelectedLeadId("");
    fetchLeads();
    setDialogOpen(true);
  };

  const selectLead = (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const fullName = (lead.full_name || "").trim();
    const parts = fullName.split(/\s+/);
    const firstName = parts.slice(0, -1).join(" ") || fullName;
    const lastName = parts.length > 1 ? parts[parts.length - 1] : "";

    setForm((f) => ({
      ...f,
      first_name: firstName,
      last_name: lastName,
      email: lead.email || "",
      phone: lead.phone_number || "",
    }));
    setSelectedLeadId(leadId);
    setLeadPopoverOpen(false);
  };

  const regeneratePassword = () => {
    setPassword(generatePassword());
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(password);
    toast({ title: "Kopiert", description: "Passwort in Zwischenablage kopiert." });
  };

  const handleCreate = async () => {
    if (!form.email || !form.first_name || !form.last_name) {
      toast({ title: "Fehler", description: "Bitte alle Pflichtfelder ausfüllen.", variant: "destructive" });
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
          balance: form.balance || null,
          scam_project: form.scam_project || null,
          source_lead_id: selectedLeadId || null,
        },
      });

      if (res.error) {
        throw new Error(res.error.message);
      }

      const result = res.data;
      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Nutzer erstellt",
        description: `Temporäres Passwort: ${result.temp_password}`,
      });

      setForm({ first_name: "", last_name: "", email: "", phone: "", balance: "", scam_project: "" });
      setPassword(generatePassword());
      setSelectedLeadId("");
      setDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message || "Nutzer konnte nicht erstellt werden.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Kopiert", description: "Passwort in Zwischenablage kopiert." });
  };

  const q = search.toLowerCase();
  const filtered = users.filter((u) =>
    [u.first_name, u.last_name, u.email, u.phone]
      .filter(Boolean)
      .some((v) => v!.toLowerCase().includes(q))
  );

  const selectedLeadLabel = selectedLeadId
    ? leads.find((l) => l.id === selectedLeadId)?.full_name || "Lead ausgewählt"
    : "Lead suchen…";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-primary" style={{ letterSpacing: "0.08em" }}>Nutzerverwaltung</p>
          <h2 className="font-display text-2xl font-semibold">Vics</h2>
          <p className="mt-2 text-sm text-muted-foreground">Konten, Kontaktdaten und Zugangsinformationen zentral verwalten.</p>
        </div>
        <Button onClick={openDialog} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Nutzer erstellen
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, Email oder Telefonnummer suchen…"
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Keine Nutzer vorhanden.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vorname</TableHead>
                  <TableHead>Nachname</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Temp. Passwort</TableHead>
                  <TableHead>Erstellt am</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/50">
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => navigate(`/admin/vics/${u.id}`)}
                    >
                      {u.first_name ?? "–"}
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => navigate(`/admin/vics/${u.id}`)}
                    >
                      {u.last_name ?? "–"}
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => navigate(`/admin/vics/${u.id}`)}
                    >
                      {u.email ?? "–"}
                    </TableCell>
                    <TableCell
                      className={u.phone ? "cursor-pointer" : ""}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (u.phone) {
                          navigator.clipboard.writeText(u.phone);
                          toast({ title: "Kopiert", description: "Telefonnummer in Zwischenablage kopiert." });
                        }
                      }}
                    >
                      {u.phone ?? "–"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {u.temp_password ? (
                        <span className="inline-flex items-center gap-1.5">
                          <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                            {u.temp_password}
                          </code>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(u.temp_password!);
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ) : (
                        "–"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(u.created_at).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => navigate(`/admin/vics/${u.id}`)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 gap-0">
          <DialogHeader className="space-y-0">
            <DialogShellHeader
              icon={<UserPlus className="w-5 h-5" />}
              eyebrow="Vic anlegen"
              title={<DialogTitle asChild><span>Neuen Nutzer erstellen</span></DialogTitle>}
              description="Optional aus einem bestehenden Lead vorbefüllen. Zugangsdaten werden im Klartext hinterlegt und an den Vic übermittelt."
            />
          </DialogHeader>

          <div className="space-y-6 py-6">
            <DialogSection label="Herkunft" hint="Optional">
              <Popover open={leadPopoverOpen} onOpenChange={setLeadPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={leadPopoverOpen}
                    className="w-full justify-between font-normal h-10"
                    disabled={leadsLoading}
                  >
                    <span className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      {leadsLoading ? (
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Leads laden…
                        </span>
                      ) : (
                        <span className={cn(!selectedLeadId && "text-muted-foreground")}>{selectedLeadLabel}</span>
                      )}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Name, Email oder Telefon suchen…" />
                    <CommandList>
                      <CommandEmpty>Kein Lead gefunden.</CommandEmpty>
                      <CommandGroup>
                        {leads.map((lead) => (
                          <CommandItem
                            key={lead.id}
                            value={`${lead.full_name || ""} ${lead.email || ""} ${lead.phone_number || ""}`}
                            onSelect={() => selectLead(lead.id)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedLeadId === lead.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{lead.full_name || "Unbekannt"}</span>
                              <span className="text-xs text-muted-foreground">
                                {lead.email || "–"} · {lead.phone_number || "–"}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </DialogSection>

            <DialogSection label="Persönliche Angaben">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="first_name" className="text-sm font-medium">Vorname *</Label>
                  <Input
                    id="first_name"
                    value={form.first_name}
                    onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                    placeholder="Max"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last_name" className="text-sm font-medium">Nachname *</Label>
                  <Input
                    id="last_name"
                    value={form.last_name}
                    onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                    placeholder="Mustermann"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="max@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium">Telefon</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+49 151 12345678"
                  />
                </div>
              </div>
            </DialogSection>

            <DialogSection label="Zugangsdaten" hint="Wird an den Vic übermittelt">
              <div className="rounded-md border border-border bg-muted/45 p-4 space-y-2">
                <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> Passwort
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="password"
                    value={password}
                    readOnly
                    className="font-mono bg-card text-base tracking-widest h-11"
                  />
                  <Button type="button" variant="outline" size="icon" className="h-11 w-11" onClick={regeneratePassword} title="Neu generieren">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-11 w-11" onClick={copyPassword} title="Kopieren">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  8 Zeichen · Kleinbuchstaben & Zahlen. Vor dem Erstellen bestätigen.
                </p>
              </div>
            </DialogSection>

            <DialogSection label="Vic-Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="balance" className="text-sm font-medium flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-muted-foreground" /> Guthaben
                  </Label>
                  <div className="relative">
                    <Input
                      id="balance"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.balance}
                      onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))}
                      placeholder="0,00"
                      className="pr-9"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="scam_project" className="text-sm font-medium">Scam-Projekt</Label>
                  <Input
                    id="scam_project"
                    value={form.scam_project}
                    onChange={(e) => setForm((f) => ({ ...f, scam_project: e.target.value }))}
                    placeholder="XYZ Investment"
                  />
                </div>
              </div>
            </DialogSection>
          </div>

          <DialogFooterBar>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Abbrechen
            </Button>
            <Button onClick={handleCreate} disabled={submitting} className="gap-2 min-w-[140px]">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Erstellt…</> : <><UserPlus className="w-4 h-4" /> Nutzer erstellen</>}
            </Button>
          </DialogFooterBar>
        </DialogContent>
      </Dialog>
    </div>
  );
}
