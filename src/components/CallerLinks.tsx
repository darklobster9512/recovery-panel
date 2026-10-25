import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Link2, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useActiveBranding } from "@/contexts/BrandingContext";

export interface CallerLite {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  branding_id: string | null;
}
interface LinkRow { caller_id: string; group_id: string }

const nameOf = (c?: CallerLite) =>
  c ? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.email || "Caller" : "Caller";

/** Loads all caller profiles (all brands) + link rows. Admin-only. */
export function useCallerLinks() {
  const [all, setAll] = useState<CallerLite[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const reload = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "caller");
    const ids = (roles ?? []).map((r) => r.user_id);
    const [{ data: profs }, { data: l }] = await Promise.all([
      ids.length
        ? (supabase as any).from("profiles").select("id, first_name, last_name, email, branding_id").in("id", ids)
        : Promise.resolve({ data: [] }),
      (supabase as any).from("caller_account_links").select("caller_id, group_id"),
    ]);
    setAll((profs as CallerLite[]) ?? []);
    setLinks((l as LinkRow[]) ?? []);
  };
  useEffect(() => { reload(); }, []);
  const linkedOf = (id: string) => {
    const g = links.find((x) => x.caller_id === id)?.group_id;
    if (!g) return [];
    return links.filter((x) => x.group_id === g && x.caller_id !== id)
      .map((x) => all.find((c) => c.id === x.caller_id)).filter(Boolean) as CallerLite[];
  };
  return { all, links, reload, linkedOf };
}

export function LinkedBadges({ callerId, ctx, onChanged }: { callerId: string; ctx: ReturnType<typeof useCallerLinks>; onChanged: () => void }) {
  const { brandings } = useActiveBranding();
  const { toast } = useToast();
  const linked = ctx.linkedOf(callerId);
  if (!linked.length) return <span className="text-muted-foreground">—</span>;
  const unlink = async (id: string) => {
    const { error } = await (supabase as any).from("caller_account_links").delete().eq("caller_id", id);
    if (error) return toast({ title: "Fehler", description: error.message, variant: "destructive" });
    // Remove lone remaining member of group
    const g = ctx.links.find((x) => x.caller_id === id)?.group_id;
    const rest = ctx.links.filter((x) => x.group_id === g && x.caller_id !== id);
    if (rest.length === 1) await (supabase as any).from("caller_account_links").delete().eq("caller_id", rest[0].caller_id);
    onChanged();
  };
  return (
    <div className="flex flex-wrap gap-1">
      {linked.map((c) => (
        <Badge key={c.id} variant="secondary" className="gap-1 font-normal">
          {nameOf(c)} · {brandings.find((b) => b.id === c.branding_id)?.company_name ?? "—"}
          <button onClick={() => unlink(c.id)} title="Verknüpfung lösen"><X className="h-3 w-3" /></button>
        </Badge>
      ))}
    </div>
  );
}

export function CallerLinkDialog({ caller, ctx, onClose, onChanged }: {
  caller: CallerLite | null; ctx: ReturnType<typeof useCallerLinks>; onClose: () => void; onChanged: () => void;
}) {
  const { brandings } = useActiveBranding();
  const { toast } = useToast();
  const [sel, setSel] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (caller) setSel(ctx.linkedOf(caller.id).map((c) => c.id)); }, [caller?.id]);
  if (!caller) return null;

  const candidates = ctx.all.filter((c) => c.id !== caller.id && c.branding_id !== caller.branding_id);
  const toggle = (c: CallerLite) => setSel((s) => {
    if (s.includes(c.id)) return s.filter((x) => x !== c.id);
    // one account per brand
    const sameBrand = ctx.all.filter((o) => o.branding_id === c.branding_id).map((o) => o.id);
    return [...s.filter((x) => !sameBrand.includes(x)), c.id];
  });

  const save = async () => {
    setSaving(true);
    try {
      const members = [caller.id, ...sel];
      const existingGroup = ctx.links.find((x) => members.includes(x.caller_id))?.group_id;
      const groupId = existingGroup ?? crypto.randomUUID();
      // Drop old membership of the current group, then write new set
      const oldIds = ctx.links.filter((x) => x.group_id === existingGroup).map((x) => x.caller_id);
      const del = Array.from(new Set([...members, ...oldIds]));
      await (supabase as any).from("caller_account_links").delete().in("caller_id", del);
      if (sel.length) {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await (supabase as any).from("caller_account_links")
          .insert(members.map((id) => ({ caller_id: id, group_id: groupId, created_by: u.user?.id })));
        if (error) throw error;
      }
      toast({ title: sel.length ? "Konten verknüpft" : "Verknüpfung entfernt" });
      onChanged();
      onClose();
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!caller} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Konten verknüpfen – {nameOf(caller)}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">
          Wähle Caller-Konten aus anderen Brandings. Verknüpfte Konten können über die Sidebar ohne Passwort wechseln. Pro Branding ein Konto.
        </p>
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {candidates.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Keine Caller in anderen Brandings.</p>}
          {candidates.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 hover:bg-muted/50">
              <Checkbox checked={sel.includes(c.id)} onCheckedChange={() => toggle(c)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{nameOf(c)}</p>
                <p className="truncate text-xs text-muted-foreground">{brandings.find((b) => b.id === c.branding_id)?.company_name ?? "Ohne Branding"} · {c.email}</p>
              </div>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
