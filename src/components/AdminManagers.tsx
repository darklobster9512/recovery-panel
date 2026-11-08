import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveBranding } from "@/contexts/BrandingContext";
import { invalidateBrandingProfileIds } from "@/lib/branding";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Loader2, Pencil, RefreshCw, Trash2, Copy } from "lucide-react";

interface Person { id: string; first_name: string | null; last_name: string | null; email: string | null; temp_password?: string | null; branding_id?: string | null }

const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
function generatePassword(len = 10) {
  const buf = new Uint32Array(len);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => CHARS[n % CHARS.length]).join("");
}
const label = (p: Person) => [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || p.id;

export default function AdminManagers() {
  const { toast } = useToast();
  const { brandings } = useActiveBranding();
  const [managers, setManagers] = useState<Person[]>([]);
  const [callers, setCallers] = useState<Person[]>([]);
  const [mgrCallers, setMgrCallers] = useState<{ manager_id: string; caller_id: string }[]>([]);
  const [mgrBrands, setMgrBrands] = useState<{ manager_id: string; branding_id: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "" });
  const [password, setPassword] = useState(generatePassword());
  const [selBrands, setSelBrands] = useState<string[]>([]);
  const [selCallers, setSelCallers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Person | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("role", ["manager", "caller"] as any);
    const mIds = (roles ?? []).filter((r: any) => r.role === "manager").map((r) => r.user_id);
    const cIds = (roles ?? []).filter((r: any) => r.role === "caller").map((r) => r.user_id);
    const all = [...mIds, ...cIds];
    const [{ data: profs }, { data: mc }, { data: mb }] = await Promise.all([
      all.length ? (supabase as any).from("profiles").select("id, first_name, last_name, email, temp_password, branding_id").in("id", all) : Promise.resolve({ data: [] }),
      (supabase as any).from("manager_callers").select("manager_id, caller_id"),
      (supabase as any).from("manager_brandings").select("manager_id, branding_id"),
    ]);
    const list = (profs ?? []) as Person[];
    setManagers(list.filter((p) => mIds.includes(p.id)));
    setCallers(list.filter((p) => cIds.includes(p.id)).sort((a, b) => label(a).localeCompare(label(b))));
    setMgrCallers(mc ?? []);
    setMgrBrands(mb ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const brandName = useMemo(() => new Map(brandings.map((b) => [b.id, b.company_name])), [brandings]);
  const callerOwner = useMemo(() => new Map(mgrCallers.map((r) => [r.caller_id, r.manager_id])), [mgrCallers]);
  const managerName = useMemo(() => new Map(managers.map((m) => [m.id, label(m)])), [managers]);

  // Only callers of the chosen brands are offered.
  const callerChoices = callers.filter((c) => selBrands.length === 0 || (c.branding_id && selBrands.includes(c.branding_id)));

  const openNew = () => {
    setEditing(null);
    setForm({ first_name: "", last_name: "", email: "" });
    setPassword(generatePassword());
    setSelBrands([]);
    setSelCallers([]);
    setOpen(true);
  };
  const openEdit = (m: Person) => {
    setEditing(m);
    setForm({ first_name: m.first_name ?? "", last_name: m.last_name ?? "", email: m.email ?? "" });
    setSelBrands(mgrBrands.filter((r) => r.manager_id === m.id).map((r) => r.branding_id));
    setSelCallers(mgrCallers.filter((r) => r.manager_id === m.id).map((r) => r.caller_id));
    setOpen(true);
  };

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const saveLinks = async (managerId: string) => {
    const db = supabase as any;
    await db.from("manager_brandings").delete().eq("manager_id", managerId);
    if (selBrands.length) {
      const { error } = await db.from("manager_brandings").insert(selBrands.map((b) => ({ manager_id: managerId, branding_id: b })));
      if (error) throw error;
    }
    await db.from("manager_callers").delete().eq("manager_id", managerId);
    if (selCallers.length) {
      await db.from("manager_callers").delete().in("caller_id", selCallers);
      const { error } = await db.from("manager_callers").insert(selCallers.map((c) => ({ manager_id: managerId, caller_id: c })));
      if (error) throw error;
    }
  };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name || (!editing && !form.email)) {
      toast({ title: "Bitte Vorname, Nachname und Email ausfüllen.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.from("profiles").update({ first_name: form.first_name, last_name: form.last_name, branding_id: selBrands[0] ?? null } as any).eq("id", editing.id);
        if (error) throw error;
        await saveLinks(editing.id);
        toast({ title: "Manager gespeichert" });
      } else {
        invalidateBrandingProfileIds();
        const res = await supabase.functions.invoke("create-user", {
          body: { ...form, password, role: "manager", branding_id: selBrands[0] ?? null, branding_ids: selBrands, caller_ids: selCallers },
        });
        const r: any = res.data;
        if (res.error || r?.error) throw new Error(r?.error ?? res.error?.message);
        toast({ title: "Manager erstellt", description: `${form.email} · Passwort: ${password}` });
      }
      setOpen(false);
      load();
    } catch (e) {
      toast({ title: "Speichern fehlgeschlagen", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("delete-caller", { body: { caller_id: deleting.id } });
    setSaving(false);
    if (error || (data as any)?.error) {
      toast({ title: "Löschen fehlgeschlagen", description: (data as any)?.error ?? error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Manager gelöscht" });
    setDeleting(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-primary" style={{ letterSpacing: "0.08em" }}>Vertrieb</p>
          <h2 className="font-display text-2xl font-semibold">Manager</h2>
          <p className="mt-2 text-sm text-muted-foreground">Manager sehen nur ihre zugewiesenen Vics und die ihrer Caller.</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Briefcase className="w-4 h-4" /> Manager erstellen</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : managers.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Noch keine Manager angelegt.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Temp. Passwort</TableHead>
                  <TableHead>Brandings</TableHead>
                  <TableHead>Caller</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managers.map((m) => {
                  const bs = mgrBrands.filter((r) => r.manager_id === m.id);
                  const cs = mgrCallers.filter((r) => r.manager_id === m.id);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{label(m)}</TableCell>
                      <TableCell className="text-sm">{m.email}</TableCell>
                      <TableCell className="text-sm">
                        {m.temp_password ? (
                          <span className="inline-flex items-center gap-1.5 font-mono">
                            {m.temp_password}
                            <button onClick={() => navigator.clipboard.writeText(m.temp_password!)} className="text-muted-foreground hover:text-foreground" title="Kopieren"><Copy className="w-3.5 h-3.5" /></button>
                          </span>
                        ) : "–"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {bs.length ? bs.map((b) => <Badge key={b.branding_id} variant="secondary">{brandName.get(b.branding_id) ?? "?"}</Badge>) : <span className="text-sm text-muted-foreground">–</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {cs.length ? cs.map((c) => label(callers.find((x) => x.id === c.caller_id) ?? { id: c.caller_id } as Person)).join(", ") : "–"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="outline" size="sm" className="gap-1.5 mr-2" onClick={() => openEdit(m)}><Pencil className="w-3.5 h-3.5" /> Bearbeiten</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(m)} title="Löschen"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Manager bearbeiten" : "Manager erstellen"}</DialogTitle></DialogHeader>
          <div className="space-y-5 py-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Vorname</Label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Nachname</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Email</Label><Input type="email" value={form.email} disabled={!!editing} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              {!editing && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Passwort</Label>
                  <div className="flex gap-2">
                    <Input value={password} readOnly className="font-mono" />
                    <Button type="button" variant="outline" size="icon" onClick={() => setPassword(generatePassword())}><RefreshCw className="w-4 h-4" /></Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase text-muted-foreground">Brandings</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {brandings.map((b) => (
                  <label key={b.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm cursor-pointer">
                    <Checkbox checked={selBrands.includes(b.id)} onCheckedChange={() => toggle(selBrands, setSelBrands, b.id)} />
                    {b.company_name}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase text-muted-foreground">Caller dieses Managers</Label>
              {callerChoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Caller in den gewählten Brandings.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {callerChoices.map((c) => {
                    const owner = callerOwner.get(c.id);
                    const other = owner && owner !== editing?.id ? managerName.get(owner) : null;
                    return (
                      <label key={c.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm cursor-pointer">
                        <Checkbox checked={selCallers.includes(c.id)} onCheckedChange={() => toggle(selCallers, setSelCallers, c.id)} />
                        <span className="min-w-0 flex-1 truncate">{label(c)}</span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {other ? `bei ${other}` : brandName.get(c.branding_id ?? "") ?? ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Ein Caller kann nur einem Manager gehören. Wählst du einen Caller eines anderen Managers, wechselt er zu diesem.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[140px]">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editing ? "Speichern" : "Manager erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && !saving && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Manager löschen?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleting && label(deleting)} wird gelöscht. Die Vics bleiben bei ihren Callern, die Caller bleiben bestehen.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={saving}>Abbrechen</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
