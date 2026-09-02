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
import { Plus, Pencil, Trash2, X, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AssignVerificationDialog from "@/components/AssignVerificationDialog";
import AdminAssignmentHistory from "@/components/AdminAssignmentHistory";

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
    const { data } = supabase.storage.from("verification-logos").getPublicUrl(path);
    return data.publicUrl;
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

    if (editing) {
      const { error } = await supabase
        .from("verifications")
        .update({
          title: title.trim(),
          logo_url: logoUrl,
          instructions: filteredInstructions,
          required_fields: requiredFields,
          appstore_url: appstoreUrl.trim() || null,
          playstore_url: playstoreUrl.trim() || null,
        })
        .eq("id", editing.id);
      if (error) {
        toast({ title: "Fehler beim Speichern", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Verifikation aktualisiert" });
      }
    } else {
      const { error } = await supabase.from("verifications").insert({
        title: title.trim(),
        logo_url: logoUrl,
        instructions: filteredInstructions,
        required_fields: requiredFields,
        appstore_url: appstoreUrl.trim() || null,
        playstore_url: playstoreUrl.trim() || null,
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
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Create Card */}
        <Card
          className="border-dashed border-2 border-gray-300 bg-white hover:border-[hsl(221,100%,50%)] hover:bg-[hsl(221,100%,97%)] cursor-pointer transition-colors flex items-center justify-center min-h-[180px]"
          onClick={openCreate}
        >
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Plus className="w-10 h-10 text-gray-400" />
            <span className="text-sm text-gray-500 mt-2">Neu erstellen</span>
          </CardContent>
        </Card>

        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-gray-200 bg-white min-h-[180px] animate-pulse" />
            ))
          : verifications.map((v) => (
              <Card key={v.id} className="border-gray-200 bg-white min-h-[180px] relative group">
                <CardContent className="p-4 flex flex-col items-center justify-center h-full gap-3">
                  {v.logo_url ? (
                    <img
                      src={v.logo_url}
                      alt={v.title}
                      className="w-14 h-14 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-medium">
                      Logo
                    </div>
                  )}
                  <span className="text-sm font-semibold text-foreground text-center">{v.title}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
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

      <div className="mt-8">
        <AdminAssignmentHistory />
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Verifikation bearbeiten" : "Neue Verifikation"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Logo */}
            <div>
              <Label>Logo</Label>
              <div className="mt-1 flex items-center gap-3">
                {(logoPreview || logoFile) && (
                  <img
                    src={logoFile ? URL.createObjectURL(logoFile) : logoPreview!}
                    alt="Logo"
                    className="w-12 h-12 rounded-lg object-contain border border-border"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setLogoFile(f);
                    if (f) setLogoPreview(URL.createObjectURL(f));
                  }}
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <Label>Titel</Label>
              <Input
                className="mt-1"
                placeholder="z.B. BBVA"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Instructions */}
            <div>
              <Label>Anweisungen</Label>
              <div className="space-y-2 mt-1">
                {instructions.map((inst, idx) => (
                  <div key={idx} className="flex gap-2">
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
                        className="shrink-0"
                        onClick={() => removeInstruction(idx)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addInstruction}>
                  <Plus className="w-4 h-4 mr-1" /> Anweisung hinzufügen
                </Button>
              </div>
            </div>

            {/* Download Links */}
            <div>
              <Label>App Store Link</Label>
              <Input
                className="mt-1"
                placeholder="https://apps.apple.com/..."
                value={appstoreUrl}
                onChange={(e) => setAppstoreUrl(e.target.value)}
              />
            </div>
            <div>
              <Label>Play Store Link</Label>
              <Input
                className="mt-1"
                placeholder="https://play.google.com/..."
                value={playstoreUrl}
                onChange={(e) => setPlaystoreUrl(e.target.value)}
              />
            </div>

            {/* Required Fields */}
            <div>
              <Label>Erforderliche Verifikationsdaten</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {REQUIRED_FIELD_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={requiredFields.includes(opt.value)}
                      onCheckedChange={() => toggleField(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row justify-between sm:justify-between">
            {editing && (
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={saving}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Löschen
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} disabled={saving}>
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Speichert..." : "Speichern"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verifikation löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Dialog */}
      <AssignVerificationDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        verification={assignVerification}
      />
    </>
  );
}
