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
import { Search, Plus, ChevronsUpDown, Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import VerificationLogo from "@/components/VerificationLogo";
import { cn } from "@/lib/utils";

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
    onAssigned?.();
    onOpenChange(false);

    setSaving(false);
  };

  if (!verification) return null;

  // Step 1: Vic selection
  if (!selectedVic) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vic auswählen – {verification.title}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[320px] -mx-2">
            {loadingVics ? (
              <p className="text-sm text-muted-foreground text-center py-8">Laden...</p>
            ) : availableVics.length === 0 && assignedVics.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Keine Vics gefunden</p>
            ) : (
              <div className="space-y-1 px-2">
                {availableVics.map((v) => (
                  <button
                    key={v.id}
                    className="w-full text-left px-3 py-2.5 rounded-md hover:bg-accent transition-colors text-sm"
                    onClick={() => setSelectedVic(v)}
                  >
                    <span className="font-medium text-foreground">
                      {v.first_name || ""} {v.last_name || ""}
                    </span>
                    {v.email && (
                      <span className="text-muted-foreground ml-2 text-xs">{v.email}</span>
                    )}
                  </button>
                ))}
                {assignedVics.length > 0 && (
                  <>
                    <Separator className="my-2" />
                    <p className="text-xs text-muted-foreground px-3 py-1 font-medium">Bereits zugewiesen</p>
                    {assignedVics.map((v) => (
                      <div
                        key={v.id}
                        className="w-full text-left px-3 py-2.5 rounded-md text-sm opacity-50 cursor-default"
                      >
                        <span className="font-medium text-foreground">
                          {v.first_name || ""} {v.last_name || ""}
                        </span>
                        {v.email && (
                          <span className="text-muted-foreground ml-2 text-xs">{v.email}</span>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </ScrollArea>
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <VerificationLogo
              value={verification.logo_url ?? null}
              alt={verification.title}
              className="w-10 h-10 rounded-md object-cover shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Auftrag</p>
              <DialogTitle className="truncate">{verification.title}</DialogTitle>
            </div>
          </div>
          <p className="text-sm text-muted-foreground pt-2">
            Daten für {selectedVic.first_name} {selectedVic.last_name}
          </p>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {isPostident && (
            <div>
              <Label>PDF-Datei (Postident)</Label>
              <Input
                className="mt-1"
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              />
              {pdfFile && (
                <p className="text-xs text-muted-foreground mt-1">{pdfFile.name}</p>
              )}
            </div>
          )}
          {!isPostident && orderedNonPhone.map((field) => (
            <div key={field}>
              <Label>{FIELD_LABELS[field] || field}</Label>
              <Input
                className="mt-1"
                placeholder={FIELD_LABELS[field] || field}
                value={fieldValues[field] || ""}
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
            </div>
          ))}

          {!isPostident && uniqueRequired.includes("phone") && (
            <div>
              <Label>Telefonnummer</Label>
              {!showNewPhone ? (
                <div className="space-y-2 mt-1">
                  <Popover open={phonePopoverOpen} onOpenChange={setPhonePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        <span className={cn(!selectedPhoneLabel && "text-muted-foreground")}>
                          {selectedPhoneLabel || "Telefonnummer auswählen"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                      <Command>
                        <CommandInput placeholder="Nummer suchen..." />
                        <CommandList>
                          <CommandEmpty>
                            {loadingPhones ? "Laden..." : "Keine Nummer gefunden"}
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
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewPhone(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Neuen Anosim-Link hinzufügen
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 mt-1">
                  <Input
                    placeholder="https://anosim.net/share?token=..."
                    value={newPhoneLink}
                    onChange={(e) => setNewPhoneLink(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddPhone}
                      disabled={addingPhone || !newPhoneLink.trim()}
                    >
                      {addingPhone ? "Speichert..." : "Speichern"}
                    </Button>
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
                </div>
          )}

          {!isPostident && uniqueRequired.includes("phone") && (
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border accent-primary"
                checked={forwardTanToVic}
                onChange={(e) => setForwardTanToVic(e.target.checked)}
              />
              <span>TAN an Vic-Nummer senden</span>
            </label>
          )}
        </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setSelectedVic(null)} disabled={saving}>
            Zurück
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Speichert..." : "Zuweisen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
