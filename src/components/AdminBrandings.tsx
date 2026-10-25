import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, EyeOff, Globe, Pencil, Plus, Trash2, Users, Headphones, Upload, Check } from "lucide-react";
import { toast } from "sonner";
import { EMPTY_BRANDING, fileToDataUrl, type Branding } from "@/lib/branding";
import { useActiveBranding } from "@/contexts/BrandingContext";

type Form = Omit<Branding, "id" | "created_at">;

const TEXT_FIELDS: { key: keyof Form; label: string; placeholder?: string }[] = [
  { key: "company_name", label: "Firmenname", placeholder: "Korte & Partner" },
  { key: "tagline", label: "Untertitel", placeholder: "Rechtsanwaltskanzlei" },
  { key: "street", label: "Straße & Hausnummer" },
  { key: "city", label: "PLZ & Ort" },
  { key: "phone", label: "Telefon" },
  { key: "email", label: "E-Mail" },
  { key: "lawyer", label: "Anwalt" },
  { key: "vat_id", label: "USt-ID" },
  { key: "website", label: "Website", placeholder: "kortekanzlei.de" },
];

const MAX_LOGO = 400 * 1024;

export default function AdminBrandings() {
  const { brandings, reload, activeBrandingId, setActive } = useActiveBranding();
  const [counts, setCounts] = useState<Record<string, { vics: number; callers: number }>>({});
  const [editing, setEditing] = useState<Branding | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY_BRANDING);
  const [domainsText, setDomainsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Branding | null>(null);

  useEffect(() => {
    (async () => {
      const [roles, profiles] = await Promise.all([
        supabase.from("user_roles").select("user_id, role").in("role", ["caller", "user"]),
        (supabase as any).from("profiles").select("id, branding_id").limit(5000),
      ]);
      const roleMap = new Map((roles.data ?? []).map((r) => [r.user_id, r.role]));
      const c: Record<string, { vics: number; callers: number }> = {};
      for (const p of (profiles.data ?? []) as { id: string; branding_id: string | null }[]) {
        if (!p.branding_id) continue;
        c[p.branding_id] ??= { vics: 0, callers: 0 };
        const r = roleMap.get(p.id);
        if (r === "caller") c[p.branding_id].callers++;
        else if (r === "user") c[p.branding_id].vics++;
      }
      setCounts(c);
    })();
  }, [brandings]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_BRANDING);
    setDomainsText("");
    setOpen(true);
  }

  function openEdit(b: Branding) {
    setEditing(b);
    const { id: _id, created_at: _c, ...rest } = b;
    setForm({ ...EMPTY_BRANDING, ...rest });
    setDomainsText((b.additional_domains ?? []).join(", "));
    setOpen(true);
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function onImage(file: File | undefined, key: "logo_url" | "favicon_url") {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Bitte ein Bild auswählen");
    if (file.size > MAX_LOGO) return toast.error("Bild zu groß (max. 400 KB)");
    set(key, await fileToDataUrl(file));
  }

  async function save() {
    if (!form.company_name.trim()) return toast.error("Firmenname fehlt");
    setSaving(true);
    const payload = {
      ...form,
      domain: form.domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, ""),
      additional_domains: domainsText.split(/[\s,]+/).map((d) => d.trim().toLowerCase()).filter(Boolean),
    };
    const q = editing
      ? (supabase as any).from("brandings").update(payload).eq("id", editing.id)
      : (supabase as any).from("brandings").insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) return toast.error("Speichern fehlgeschlagen: " + error.message);
    toast.success(editing ? "Branding gespeichert" : "Branding angelegt");
    setOpen(false);
    await reload();
  }

  async function remove(b: Branding) {
    const c = counts[b.id];
    if (c && (c.vics || c.callers)) {
      toast.error("Branding hat noch zugewiesene Vics oder Caller");
      setConfirmDelete(null);
      return;
    }
    const { error } = await (supabase as any).from("brandings").delete().eq("id", b.id);
    setConfirmDelete(null);
    if (error) return toast.error("Löschen fehlgeschlagen: " + error.message);
    toast.success("Branding gelöscht");
    await reload();
  }

  const keyType = showKeys ? "text" : "password";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-primary" style={{ letterSpacing: "0.08em" }}>Marken</p>
          <h2 className="font-display text-2xl font-semibold">Brandings</h2>
          <p className="mt-2 text-sm text-muted-foreground">Firmendaten, Domains sowie E-Mail- und SMS-Versand pro Marke.</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Neues Branding</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {brandings.map((b) => {
          const c = counts[b.id] ?? { vics: 0, callers: 0 };
          const isActive = b.id === activeBrandingId;
          return (
            <Card key={b.id} className={`overflow-hidden border-t-4 transition-all duration-200 hover:shadow-lg`} style={{ borderTopColor: b.brand_color }}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start gap-3">
                  {b.logo_url ? (
                    <img src={b.logo_url} alt={b.company_name} className="h-14 w-14 shrink-0 rounded-lg border border-border bg-card object-contain p-1" />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-primary-foreground" style={{ background: b.brand_color }}>
                      {b.company_name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-semibold leading-tight">{b.company_name}</p>
                    {b.tagline && <p className="mt-0.5 text-xs text-muted-foreground">{b.tagline}</p>}
                    {isActive && <Badge variant="secondary" className="mt-2">Aktiv</Badge>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" title="Bearbeiten" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title="Löschen" onClick={() => setConfirmDelete(b)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> {b.domain || "Keine Domain"}{b.additional_domains?.length ? ` + ${b.additional_domains.length} weitere` : ""}</p>
                  <p className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {c.vics} Vics</span>
                    <span className="inline-flex items-center gap-1"><Headphones className="h-3.5 w-3.5" /> {c.callers} Caller</span>
                  </p>
                </div>
                {!isActive && (
                  <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => setActive(b.id)}>
                    <Check className="h-3.5 w-3.5" /> Als aktiv wählen
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
        {brandings.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Brandings angelegt.</p>}
      </div>

      <Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>{editing ? "Branding bearbeiten" : "Neues Branding"}</DialogTitle></DialogHeader>

          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Erscheinungsbild</h3>
              <div className="flex flex-wrap items-end gap-6">
                {(["logo_url", "favicon_url"] as const).map((k) => (
                  <div key={k} className="space-y-1.5">
                    <Label>{k === "logo_url" ? "Logo" : "Favicon"}</Label>
                    <div className="flex items-center gap-2">
                      {form[k] ? (
                        <img src={form[k]!} alt="" className="h-14 w-14 rounded-lg border border-border object-contain p-1" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground"><Upload className="h-4 w-4" /></div>
                      )}
                      <div className="flex flex-col gap-1">
                        <Button asChild size="sm" variant="outline">
                          <label className="cursor-pointer">
                            Hochladen
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => onImage(e.target.files?.[0], k)} />
                          </label>
                        </Button>
                        {form[k] && <Button size="sm" variant="ghost" onClick={() => set(k, null)}>Entfernen</Button>}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="space-y-1.5">
                  <Label>Markenfarbe</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.brand_color} onChange={(e) => set("brand_color", e.target.value)} className="h-10 w-12 cursor-pointer rounded border border-border bg-transparent" />
                    <Input value={form.brand_color} onChange={(e) => set("brand_color", e.target.value)} className="w-28" />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Firmendaten</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {TEXT_FIELDS.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label>{f.label}</Label>
                    <Input value={(form[f.key] as string) ?? ""} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value as any)} />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Domains</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Hauptdomain</Label>
                  <Input value={form.domain} placeholder="kortekanzlei.de" onChange={(e) => set("domain", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Portal-Subdomain</Label>
                  <Input value={form.panel_subprefix} placeholder="portal" onChange={(e) => set("panel_subprefix", e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Weitere Domains (durch Komma getrennt)</Label>
                  <Input value={domainsText} placeholder="kortekanzlei.com, portal.beispiel.de" onChange={(e) => setDomainsText(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Die Login-Seite zeigt dieses Branding, wenn sie über eine dieser Domains aufgerufen wird.</p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">E-Mail & SMS Versand</h3>
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => setShowKeys((v) => !v)}>
                  {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {showKeys ? "Verbergen" : "Anzeigen"}
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 rounded-md border border-border p-4 sm:grid-cols-2">
                <p className="text-xs font-semibold text-muted-foreground sm:col-span-2">Resend</p>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>API-Key</Label>
                  <Input type={keyType} value={form.resend_api_key} placeholder="re_..." onChange={(e) => set("resend_api_key", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Absendername</Label>
                  <Input value={form.resend_from_name} onChange={(e) => set("resend_from_name", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Absender-E-Mail</Label>
                  <Input value={form.resend_from_email} onChange={(e) => set("resend_from_email", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 rounded-md border border-border p-4 sm:grid-cols-2">
                <p className="text-xs font-semibold text-muted-foreground sm:col-span-2">seven.io</p>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>API-Key</Label>
                  <Input type={keyType} value={form.sevenio_api_key} onChange={(e) => set("sevenio_api_key", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Absendername (max. 11 Zeichen)</Label>
                  <Input value={form.sevenio_from_name} maxLength={11} onChange={(e) => set("sevenio_from_name", e.target.value)} />
                </div>
              </div>
            </section>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Abbrechen</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Speichert…" : "Speichern"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Branding löschen?</AlertDialogTitle>
            <AlertDialogDescription>„{confirmDelete?.company_name}“ wird dauerhaft gelöscht. Nur möglich, wenn keine Vics oder Caller zugewiesen sind.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && remove(confirmDelete)}>Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
