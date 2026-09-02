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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
  verification: { id: string; title: string; required_fields: string[]; type?: string } | null;
}

export default function AssignVerificationDialog({ open, onOpenChange, verification }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Step 1: Vic selection
  const [vics, setVics] = useState<VicUser[]>([]);
  const [loadingVics, setLoadingVics] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedVic, setSelectedVic] = useState<VicUser | null>(null);
  const [assignedUserIds, setAssignedUserIds] = useState<Set<string>>(new Set());

  // Step 2: Field values
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [phoneDataMap, setPhoneDataMap] = useState<Record<string, string>>({});
  const [loadingPhones, setLoadingPhones] = useState(false);
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>("");
  const [showNewPhone, setShowNewPhone] = useState(false);
  const [newPhoneLink, setNewPhoneLink] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
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

  const fetchPhoneNumbers = async () => {
    setLoadingPhones(true);
    const { data } = await supabase
      .from("phone_numbers")
      .select("id, token, api_url");
    const phones = (data as PhoneNumber[]) || [];
    setPhoneNumbers(phones);

    // Fetch actual phone numbers via anosim-proxy
    const map: Record<string, string> = {};
    await Promise.all(
      phones.map(async (p) => {
        try {
          const { data: proxyData } = await supabase.functions.invoke("anosim-proxy", {
            body: { token: p.token },
          });
          if (proxyData?.number) {
            map[p.id] = proxyData.number;
          }
        } catch {
          // fallback handled in render
        }
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

    let phoneNumberId: string | null = null;

    // Handle new phone link (only relevant for non-postident with phone field)
    if (!isPostident && verification.required_fields.includes("phone") && showNewPhone && newPhoneLink.trim()) {
      const token = extractToken(newPhoneLink.trim());
      if (!token) {
        toast({ title: "Ungültiger Anosim-Link", variant: "destructive" });
        setSaving(false);
        return;
      }
      const { data: inserted, error } = await supabase
        .from("phone_numbers")
        .insert({ token, api_url: newPhoneLink.trim(), created_by: user?.id })
        .select("id")
        .single();
      if (error || !inserted) {
        toast({ title: "Fehler beim Speichern der Telefonnummer", description: error?.message, variant: "destructive" });
        setSaving(false);
        return;
      }
      phoneNumberId = inserted.id;
    } else if (!isPostident && verification.required_fields.includes("phone") && selectedPhoneId) {
      phoneNumberId = selectedPhoneId;
    }

    const { data: assignment, error } = await supabase
      .from("verification_assignments")
      .insert({
        verification_id: verification.id,
        user_id: selectedVic.id,
        field_values: isPostident ? {} : fieldValues,
        phone_number_id: phoneNumberId,
        created_by: user?.id,
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
        toast({ title: "Fehler beim Speichern der Dokument-Info", description: docErr.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    toast({ title: "Verifikation zugewiesen" });
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

  // Step 2: Data entry
  const nonPhoneFields = verification.required_fields.filter((f) => f !== "phone");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Daten für {selectedVic.first_name} {selectedVic.last_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {nonPhoneFields.map((field) => (
            <div key={field}>
              <Label>{FIELD_LABELS[field] || field}</Label>
              <Input
                className="mt-1"
                placeholder={FIELD_LABELS[field]}
                value={fieldValues[field] || ""}
                onChange={(e) =>
                  setFieldValues((prev) => ({ ...prev, [field]: e.target.value }))
                }
              />
            </div>
          ))}

          {verification.required_fields.includes("phone") && (
            <div>
              <Label>Telefonnummer</Label>
              {!showNewPhone ? (
                <div className="space-y-2 mt-1">
                  <Select value={selectedPhoneId} onValueChange={setSelectedPhoneId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Telefonnummer auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingPhones ? (
                        <SelectItem value="_loading" disabled>Laden...</SelectItem>
                      ) : phoneNumbers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {phoneDataMap[p.id] || p.token}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowNewPhone(false);
                      setNewPhoneLink("");
                    }}
                  >
                    Bestehende auswählen
                  </Button>
                </div>
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
