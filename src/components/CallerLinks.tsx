import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
export type CallerLinksCtx = ReturnType<typeof useCallerLinks>;

export function LinkedBadges({ callerId, ctx }: { callerId: string; ctx: CallerLinksCtx }) {
  const { brandings } = useActiveBranding();
  const linked = ctx.linkedOf(callerId);
  if (!linked.length) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {linked.map((c) => (
        <Badge key={c.id} variant="secondary" className="font-normal">
          {nameOf(c)} · {brandings.find((b) => b.id === c.branding_id)?.company_name ?? "—"}
        </Badge>
      ))}
    </div>
  );
}

export function CallerLinkPicker({ callerId, brandingId, ctx, selected, onChange }: {
  callerId: string; brandingId: string | null; ctx: CallerLinksCtx; selected: string[]; onChange: (ids: string[]) => void;
}) {
  const { brandings } = useActiveBranding();
  const candidates = ctx.all.filter((c) => c.id !== callerId && c.branding_id !== brandingId);
  const toggle = (c: CallerLite) => {
    if (selected.includes(c.id)) return onChange(selected.filter((x) => x !== c.id));
    const sameBrand = ctx.all.filter((o) => o.branding_id === c.branding_id).map((o) => o.id);
    onChange([...selected.filter((x) => !sameBrand.includes(x)), c.id]);
  };
  if (!candidates.length) return <p className="text-sm text-muted-foreground">Keine Caller in anderen Brandings.</p>;
  return (
    <div className="max-h-56 space-y-1 overflow-y-auto">
      {candidates.map((c) => (
        <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 hover:bg-muted/50">
          <Checkbox checked={selected.includes(c.id)} onCheckedChange={() => toggle(c)} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{nameOf(c)}</p>
            <p className="truncate text-xs text-muted-foreground">
              {brandings.find((b) => b.id === c.branding_id)?.company_name ?? "Ohne Branding"} · {c.email}
            </p>
          </div>
        </label>
      ))}
    </div>
  );
}

/** Replace the link group of `callerId` with exactly `selectedIds` (empty = unlink). */
export async function saveCallerLinks(callerId: string, selectedIds: string[], ctx: CallerLinksCtx) {
  const members = [callerId, ...selectedIds];
  const existingGroup = ctx.links.find((x) => x.caller_id === callerId)?.group_id
    ?? ctx.links.find((x) => selectedIds.includes(x.caller_id))?.group_id;
  const oldIds = existingGroup ? ctx.links.filter((x) => x.group_id === existingGroup).map((x) => x.caller_id) : [];
  const del = Array.from(new Set([...members, ...oldIds]));
  const { error: dErr } = await (supabase as any).from("caller_account_links").delete().in("caller_id", del);
  if (dErr) throw dErr;
  // Keep remaining old members (not removed by this edit is not intended — group = exactly members)
  if (selectedIds.length) {
    const groupId = existingGroup ?? crypto.randomUUID();
    const { data: u } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("caller_account_links")
      .insert(members.map((id) => ({ caller_id: id, group_id: groupId, created_by: u.user?.id })));
    if (error) throw error;
  }
}
