import VerificationLogo from "@/components/VerificationLogo";
import PreparedVerificationCards from "@/components/PreparedVerificationCards";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBranding } from "@/contexts/BrandingContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DialogShellHeader, DialogFooterBar } from "@/components/admin/DialogShell";
import { ClipboardCheck, ChevronsUpDown, Info, Loader2, Clock, AlertTriangle, Check, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  auftragKey, blockedBanks, DEFAULT_AUFTRAEGE, isValidBirthDate, splitVerificationTitle, type VerificationLite,
} from "@/lib/verificationRequests";

interface VicOption { id: string; name: string; email: string; hasId: boolean }
interface RequestRow {
  id: string; vic_id: string; first_name: string; last_name: string; bank: string;
  auftraege: string[]; status: string; error: string | null; created_at: string;
}
interface Form {
  first_name: string; last_name: string; birth_name: string; birth_date: string; birth_place: string;
  street: string; postal_code: string; city: string; bank: string;
}
const EMPTY: Form = { first_name: "", last_name: "", birth_name: "", birth_date: "", birth_place: "", street: "", postal_code: "", city: "", bank: "" };
type Step = "vic" | "data" | "select" | "review";

const fmt = (iso: string) => new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function RequestVerificationsSection() {
  const { role, user } = useAuth();
  const { activeBrandingId } = useActiveBranding();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [vicNames, setVicNames] = useState<Record<string, string>>({});
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    const { data } = await (supabase as any)
      .from("verification_requests")
      .select("id, vic_id, first_name, last_name, bank, auftraege, status, error, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    const list = (data ?? []) as RequestRow[];
    if (activeBrandingId && role !== "caller" && list.length) {
      const { data: ps } = await (supabase as any).from("profiles").select("id").in("id", [...new Set(list.map((r) => r.vic_id))]).eq("branding_id", activeBrandingId);
      const ok = new Set((ps ?? []).map((p: any) => p.id));
      setRows(list.filter((r) => ok.has(r.vic_id)));
    } else setRows(list);
  }, [activeBrandingId, role]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const ids = [...new Set(rows.map((r) => r.vic_id))];
    if (!ids.length) return;
    supabase.from("profiles").select("id, first_name, last_name, email").in("id", ids).then(({ data }) => {
      setVicNames(Object.fromEntries((data ?? []).map((p) => [p.id, [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || p.id])));
    });
  }, [rows]);

  const shown = showAll ? rows : rows.slice(0, 10);

  return (
    <section className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <h3 className="font-display text-lg font-semibold">Verifikationen in Auftrag geben</h3>
            <ol className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li><b className="text-foreground">1.</b> Vic auswählen und anfragen, welche Verifikationen gemacht werden sollen.</li>
              <li><b className="text-foreground">2.</b> Ein Mitarbeiter bearbeitet die Anfrage.</li>
              <li><b className="text-foreground">3.</b> Nach ca. 1–2 Stunden sind die Verifikationen verfügbar.</li>
            </ol>
          </div>
          <Button className="gap-2 self-start lg:self-center" onClick={() => setOpen(true)}>
            <ClipboardCheck className="h-4 w-4" /> Verifikation anfragen
          </Button>
        </div>
      </Card>

      <PreparedVerificationCards
        vicIds={activeBrandingId && role !== "caller" ? new Set(rows.map((r) => r.vic_id)) : null}
      />

      {rows.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase text-muted-foreground" style={{ letterSpacing: "0.08em" }}>
            Angeforderte Verifikationen ({rows.length})
          </h3>
          <div className="grid gap-2">
            {shown.map((r) => (
              <Card key={r.id} className="p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{vicNames[r.vic_id] ?? `${r.first_name} ${r.last_name}`}</p>
                    <p className="text-xs text-muted-foreground">{fmt(r.created_at)} · Bank: {r.bank}</p>
                  </div>
                  {r.status === "fehlgeschlagen" ? (
                    <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Fehlgeschlagen</Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 border-warning/50 text-warning"><Clock className="h-3 w-3" /> In Bearbeitung – noch nicht verfügbar</Badge>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.auftraege.map((a) => <Badge key={a} variant="secondary" className="font-normal">{a}</Badge>)}
                </div>
                {r.status === "fehlgeschlagen" ? (
                  <p className="mt-2 text-xs text-destructive">{r.error ?? "Unbekannter Fehler"}</p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">Verfügbar in ca. 1–2 Stunden.</p>
                )}
              </Card>
            ))}
          </div>
          {rows.length > 10 && (
            <Button variant="ghost" size="sm" onClick={() => setShowAll((s) => !s)}>{showAll ? "Weniger anzeigen" : "Weitere anzeigen"}</Button>
          )}
        </div>
      )}

      {open && <RequestDialog open={open} onClose={() => setOpen(false)} onDone={load} role={role} userId={user?.id} brandingId={activeBrandingId} />}
    </section>
  );
}

function RequestDialog({ open, onClose, onDone, role, userId, brandingId }: {
  open: boolean; onClose: () => void; onDone: () => void; role: string | null | undefined; userId?: string; brandingId?: string | null;
}) {
  const [step, setStep] = useState<Step>("vic");
  const [vics, setVics] = useState<VicOption[]>([]);
  const [vicsLoading, setVicsLoading] = useState(true);
  const [vicId, setVicId] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [vicTab, setVicTab] = useState<"ok" | "none">("ok");
  const [vicSearch, setVicSearch] = useState("");
  const [vicLimit, setVicLimit] = useState(20);
  const [form, setForm] = useState<Form>(EMPTY);
  const [images, setImages] = useState<{ front: { url: string; type: string }; back: { url: string; type: string } } | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [verifs, setVerifs] = useState<(VerificationLite & { key: string; logo_url?: string | null })[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(DEFAULT_AUFTRAEGE));
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    supabase.from("verifications").select("id, title, type, logo_url").order("title").then(({ data }) => {
      setVerifs((data ?? []).map((v) => ({ ...v, key: auftragKey(v) })));
    });
    (async () => {
      let profQ = (supabase as any).from("profiles").select("id, first_name, last_name, email").order("created_at", { ascending: false }).limit(5000);
      if (role === "caller" && userId) profQ = profQ.eq("assigned_caller_id", userId);
      else if (brandingId) profQ = profQ.eq("branding_id", brandingId);
      const [profRes, rolesRes, docsRes] = await Promise.all([
        profQ,
        role === "caller" ? Promise.resolve({ data: null }) : supabase.from("user_roles").select("user_id").eq("role", "user").limit(10000),
        supabase.from("user_documents").select("user_id").eq("kind", "personalausweis").limit(10000),
      ]);
      const vicIds = rolesRes.data ? new Set((rolesRes.data as any[]).map((r) => r.user_id)) : null;
      const withId = new Set(((docsRes.data ?? []) as any[]).map((d) => d.user_id));
      const list = ((profRes.data ?? []) as any[]).filter((p) => !vicIds || vicIds.has(p.id));
      setVics(list.map((p) => ({
        id: p.id, email: p.email ?? "", hasId: withId.has(p.id),
        name: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || p.id,
      })));
      setVicsLoading(false);
    })();
  }, [role, userId, brandingId]);

  const vic = vics.find((v) => v.id === vicId);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const startExtract = async (id: string) => {
    setStep("data");
    setExtracting(true);
    setExtractError(null);
    setImages(null);
    setForm(EMPTY);
    setTouched(false);
    const { data, error } = await supabase.functions.invoke("admin-extract-id", { body: { vic_id: id } });
    setExtracting(false);
    if (error || data?.error && !data?.images) {
      setExtractError((data as any)?.error ?? error?.message ?? "Ausweis konnte nicht geladen werden");
      return;
    }
    setImages(data.images);
    if (data.extracted) {
      const x = data.extracted;
      setForm((f) => ({
        ...f, first_name: x.first_names ?? "", last_name: x.last_name ?? "", birth_name: x.birth_name ?? "",
        birth_date: x.birth_date ?? "", birth_place: x.birth_place ?? "", street: x.street ?? "",
        postal_code: x.zip_code ?? "", city: x.city ?? "",
      }));
    } else setExtractError(data.error ?? "Daten konnten nicht automatisch gelesen werden – bitte manuell eintragen.");
  };

  const dataOk = form.first_name.trim() && form.last_name.trim() && form.bank.trim() && isValidBirthDate(form.birth_date.trim());
  const blocked = useMemo(() => blockedBanks(form.bank, verifs), [form.bank, verifs]);
  const toggle = (k: string) => { if (blocked.has(k)) return; setSelected((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; }); };
  const chosen = verifs.filter((v) => selected.has(v.key) && !blocked.has(v.key));

  const submit = async () => {
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("request-verifications", {
      body: { vic_id: vicId, ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])), auftraege: chosen.map((v) => v.key) },
    });
    setSubmitting(false);
    if (error || !data?.ok) {
      toast.error(data?.error && typeof data.error === "string" ? data.error : "Anfrage konnte nicht gesendet werden");
      onDone();
      return;
    }
    toast.success("Verifikationen angefragt – verfügbar in ca. 1–2 Stunden");
    onDone();
    onClose();
  };

  const [rot, setRot] = useState({ front: 0, back: 0 });
  const [zoomed, setZoomed] = useState<"front" | "back" | null>(null);
  const wide = step === "data";
  const rotate = (side: "front" | "back") => setRot((r) => ({ ...r, [side]: (r[side] + 90) % 360 }));
  const idPanel = (h: string) => images && (
    <div className={`flex min-h-0 flex-col gap-3 ${h}`}>
      <Label>Personalausweis</Label>
      {zoomed && images[zoomed].type !== "application/pdf" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-muted/30">
          <div className="flex h-8 shrink-0 items-center justify-between border-b border-border px-3">
            <p className="text-xs font-semibold text-muted-foreground">{zoomed === "front" ? "Vorderseite" : "Rückseite"} (vergrößert)</p>
            <button type="button" title="Schließen" onClick={() => setZoomed(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          <IdImage src={images[zoomed].url} alt="Ausweis vergrößert" heightClass="flex-1" rot={rot[zoomed]} onRotate={() => rotate(zoomed)} onClick={() => setZoomed(null)} />
        </div>
      ) : (["front", "back"] as const).map((side) => (
        <div key={side} className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-muted/30">
          <p className="flex h-8 shrink-0 items-center border-b border-border px-3 text-xs font-semibold text-muted-foreground">{side === "front" ? "Vorderseite" : "Rückseite"} · zum Vergrößern klicken</p>
          {images[side].type === "application/pdf" ? (
            <a href={images[side].url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-4 text-sm text-primary"><FileText className="h-4 w-4" /> PDF öffnen</a>
          ) : (
            <IdImage src={images[side].url} alt={side === "front" ? "Ausweis Vorderseite" : "Ausweis Rückseite"} heightClass="flex-1" rot={rot[side]} onRotate={() => rotate(side)} onClick={() => setZoomed(side)} />
          )}
        </div>
      ))}
    </div>
  );
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !submitting) onClose(); }}>
      <DialogContent className={`max-h-[95vh] gap-0 p-6 ${step === "review" ? "overflow-visible" : "overflow-y-auto"} ${wide ? "sm:max-w-[min(1400px,96vw)]" : "sm:max-w-2xl"}`}>
        <DialogHeader className="space-y-0">
          <DialogShellHeader
            icon={<ClipboardCheck className="h-5 w-5" />}
            eyebrow={`Schritt ${["vic", "data", "select", "review"].indexOf(step) + 1} von 4`}
            title={<DialogTitle asChild><span>Verifikation anfragen</span></DialogTitle>}
            description={vic && step !== "vic" ? `Vic: ${vic.name}` : "Vic auswählen, Daten prüfen und Verifikationen festlegen."}
          />
        </DialogHeader>

        <div className="space-y-5 pt-5">
          {step === "vic" && (
            <div className="space-y-2">
              <Label>Für welchen Vic?</Label>
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                  <div className="flex gap-1 border-b border-border p-1.5">
                    {([["ok", "Verfügbar", vics.filter((v) => v.hasId).length], ["none", "Kein Ausweis", vics.filter((v) => !v.hasId).length]] as const).map(([k, label, n]) => (
                      <button key={k} type="button" onClick={() => { setVicTab(k); setVicLimit(20); }}
                        className={`flex-1 rounded-md px-3 py-1.5 text-sm transition-colors ${vicTab === k ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-muted"}`}>
                        {label} ({n})
                      </button>
                    ))}
                  </div>
                  {(() => {
                    const q = vicSearch.trim().toLowerCase();
                    const filtered = vics.filter((v) => (vicTab === "ok" ? v.hasId : !v.hasId) && (!q || `${v.name} ${v.email}`.toLowerCase().includes(q)));
                    const shown = filtered.slice(0, vicLimit);
                    return (
                  <Command shouldFilter={false}>
                    <CommandInput autoFocus placeholder="Name oder E-Mail suchen…" value={vicSearch} onValueChange={(s) => { setVicSearch(s); setVicLimit(20); }} />
                    <CommandList className="max-h-72 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
                      <CommandEmpty>{vicsLoading ? "Lade Vics…" : "Keine Vics gefunden."}</CommandEmpty>
                      {!q && filtered.length > 0 && <p className="px-3 pt-2 text-xs text-muted-foreground">Tipp: Namen oder E-Mail eintippen.</p>}
                      {vicTab === "none" && <p className="px-3 py-2 text-xs text-muted-foreground">Für diese Vics muss zuerst ein Personalausweis hochgeladen werden.</p>}
                      <CommandGroup>
                        {shown.map((v) => (
                          <CommandItem key={v.id} value={v.id} disabled={!v.hasId} onSelect={() => { setVicId(v.id); setPickerOpen(false); }}>
                            <Check className={`mr-2 h-4 w-4 ${vicId === v.id ? "opacity-100" : "opacity-0"}`} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm">{v.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{v.email}</p>
                            </div>
                            {!v.hasId && <span className="text-xs text-muted-foreground">kein Ausweis</span>}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      {filtered.length > shown.length && (
                        <div className="p-1.5">
                          <Button variant="ghost" size="sm" className="w-full" onClick={() => setVicLimit((n) => n + 20)}>
                            Weitere anzeigen ({filtered.length - shown.length})
                          </Button>
                        </div>
                      )}
                    </CommandList>
                  </Command>
                    );
                  })()}
              </div>
              <p className="text-xs text-muted-foreground">Nur Vics mit hochgeladenem Personalausweis können gewählt werden.</p>
            </div>
          )}

          {step === "data" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <Label>Personalausweis</Label>
                {extracting && !images ? (
                  <div className="flex h-64 items-center justify-center rounded-lg border border-border text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lade Ausweis…</div>
                ) : images && zoomed && images[zoomed].type !== "application/pdf" ? (
                  <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                    <div className="flex h-8 items-center justify-between border-b border-border px-3">
                      <p className="text-xs font-semibold text-muted-foreground">{zoomed === "front" ? "Vorderseite" : "Rückseite"} (vergrößert)</p>
                      <button type="button" title="Schließen" onClick={() => setZoomed(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                    </div>
                    <IdImage src={images[zoomed].url} alt="Ausweis vergrößert" heightClass="h-[526px]" rot={rot[zoomed]}
                      onRotate={() => setRot((r) => ({ ...r, [zoomed]: (r[zoomed] + 90) % 360 }))} onClick={() => setZoomed(null)} />
                  </div>
                ) : images ? (
                  (["front", "back"] as const).map((side) => (
                    <div key={side} className="overflow-hidden rounded-lg border border-border bg-muted/30">
                      <p className="flex h-8 items-center border-b border-border px-3 text-xs font-semibold text-muted-foreground">{side === "front" ? "Vorderseite" : "Rückseite"} · zum Vergrößern klicken</p>
                      {images[side].type === "application/pdf" ? (
                        <a href={images[side].url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-4 text-sm text-primary"><FileText className="h-4 w-4" /> PDF öffnen</a>
                      ) : (
                        <IdImage src={images[side].url} alt={side === "front" ? "Ausweis Vorderseite" : "Ausweis Rückseite"} heightClass="h-60" rot={rot[side]}
                          onRotate={() => setRot((r) => ({ ...r, [side]: (r[side] + 90) % 360 }))} onClick={() => setZoomed(side)} />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-destructive">{extractError}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                  <p className="font-bold text-foreground">Diese Daten wurden per KI aus dem Ausweis extrahiert.</p>
                  <p className="mt-1 text-foreground">Bitte prüfen und bei Fehlern korrigieren. <b>Wichtiger Schritt:</b> Wurden Daten falsch übernommen, werden alle Verifikationen ungültig.</p>
                </div>
                {extracting && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> KI liest Ausweis aus…</p>}
                {!extracting && extractError && images && <p className="text-sm text-destructive">{extractError}</p>}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Vorname(n) *" value={form.first_name} onChange={set("first_name")} bad={touched && !form.first_name.trim()} />
                  <Field label="Nachname *" value={form.last_name} onChange={set("last_name")} bad={touched && !form.last_name.trim()} />
                  <Field label="Geburtsname" value={form.birth_name} onChange={set("birth_name")} />
                  <Field label="Geburtsdatum (TT.MM.JJJJ)" value={form.birth_date} onChange={set("birth_date")} placeholder="24.07.1966" bad={touched && !isValidBirthDate(form.birth_date.trim())} />
                  <Field label="Geburtsort" value={form.birth_place} onChange={set("birth_place")} />
                  <Field label="Straße und Hausnummer" value={form.street} onChange={set("street")} />
                  <Field label="PLZ" value={form.postal_code} onChange={set("postal_code")} />
                  <Field label="Ort" value={form.city} onChange={set("city")} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label>Aktuelle Bank *</Label>
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild><button type="button" aria-label="Info" className="text-muted-foreground"><Info className="h-3.5 w-3.5" /></button></TooltipTrigger>
                        <TooltipContent className="max-w-xs">Bei welcher Bank ist der Vic selbst angemeldet? Bitte beim Vic erfragen.</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input autoComplete="off" value={form.bank} onChange={set("bank")} placeholder="z. B. Sparkasse" className={touched && !form.bank.trim() ? "border-destructive" : ""} />
                </div>
              </div>
            </div>
          )}

          {step === "select" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Standardmäßig sind die fünf üblichen Verifikationen gewählt. Weitere sind optional.</p>
              {([
                ["Ausgewählt", verifs.filter((v) => selected.has(v.key) && !blocked.has(v.key))],
                ["Weitere Verifikationen", verifs.filter((v) => !selected.has(v.key) && !blocked.has(v.key))],
                ["Vic bereits Kunde", verifs.filter((v) => blocked.has(v.key))],
              ] as const).map(([label, list]) => list.length > 0 && (
                <div key={label} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label} ({list.length})</p>
                  {list.map((v) => {
                    const isBlocked = blocked.has(v.key);
                    const on = selected.has(v.key) && !isBlocked;
                    const { bank, sub } = splitVerificationTitle(v.title);
                    return (
                      <button type="button" key={v.id} disabled={isBlocked} onClick={() => toggle(v.key)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${isBlocked ? "cursor-not-allowed border-border opacity-50" : on ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                          <VerificationLogo value={v.logo_url ?? null} alt={bank} className="h-full w-full object-contain p-1"
                            fallback={<span className="text-sm font-semibold text-muted-foreground">{bank.slice(0, 2).toUpperCase()}</span>} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{bank}</p>
                          <p className="text-xs text-muted-foreground">{isBlocked ? "Vic ist bereits Kunde dieser Bank" : sub || (v.type === "postident" ? "Postident" : "Video-Ident")}</p>
                        </div>
                        {DEFAULT_AUFTRAEGE.includes(v.key) && !isBlocked && <Badge variant="secondary" className="font-normal">Standard</Badge>}
                        <Checkbox checked={on} disabled={isBlocked} className="pointer-events-none" />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg border border-border">
                {([
                  ["Vic", vic?.name], ["Vorname(n)", form.first_name], ["Nachname", form.last_name], ["Geburtsname", form.birth_name],
                  ["Geburtsdatum", form.birth_date], ["Geburtsort", form.birth_place], ["Straße", form.street],
                  ["PLZ / Ort", [form.postal_code, form.city].filter(Boolean).join(" ")], ["Aktuelle Bank", form.bank],
                ] as [string, string | undefined][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-border px-3 py-2 last:border-0">
                    <span className="text-muted-foreground">{k}</span><span className="text-right font-medium">{v || "–"}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="mb-2 font-semibold">Angefragte Verifikationen ({chosen.length})</p>
                <div className="flex flex-wrap gap-2">{chosen.map((v) => {
                  const bank = splitVerificationTitle(v.title).bank;
                  return (
                    <div key={v.id} title={v.title} className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                      <VerificationLogo value={v.logo_url ?? null} alt={v.title} className="h-full w-full object-contain p-1"
                        fallback={<span className="text-sm font-semibold text-muted-foreground">{bank.slice(0, 2).toUpperCase()}</span>} />
                    </div>
                  );
                })}</div>
              </div>
              <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-foreground">Bitte prüfe die Daten ein letztes Mal: Falsche Daten machen alle Verifikationen ungültig.</p>
            </div>
          )}
        </div>

        <DialogFooterBar className="mt-5 justify-between">
          <Button variant="ghost" disabled={submitting} onClick={() => (step === "vic" ? onClose() : setStep(step === "data" ? "vic" : step === "select" ? "data" : "select"))}>
            {step === "vic" ? "Abbrechen" : "Zurück"}
          </Button>
          {step === "vic" && <Button disabled={!vicId} onClick={() => startExtract(vicId)}>Weiter</Button>}
          {step === "data" && <Button disabled={extracting} onClick={() => { setTouched(true); if (dataOk) setStep("select"); }}>Daten bestätigen</Button>}
          {step === "select" && <Button disabled={chosen.length === 0} onClick={() => setStep("review")}>Weiter zur Überprüfung</Button>}
          {step === "review" && <Button disabled={submitting} onClick={submit}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Verbindlich anfordern</Button>}
        </DialogFooterBar>
        {step === "review" && images && (
          <>
            <div className="absolute left-full top-0 ml-3 hidden h-full w-[380px] flex-col rounded-lg border border-border bg-background p-4 shadow-lg xl:flex">
              {idPanel("h-full")}
            </div>
            <div className="mt-4 xl:hidden">{idPanel("h-[460px]")}</div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, bad, ...p }: { label: string; bad?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input {...p} className={bad ? "border-destructive" : ""} />
    </div>
  );
}

function IdImage({ src, alt, rot, onRotate, onClick, heightClass }: { src: string; alt: string; rot: number; onRotate: () => void; onClick: () => void; heightClass: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const sideways = rot % 180 !== 0;
  return (
    <div ref={boxRef} className={`relative w-full overflow-hidden ${heightClass}`}>
      <img
        src={src}
        alt={alt}
        onClick={onClick}
        className="absolute left-1/2 top-1/2 cursor-zoom-in object-contain"
        style={{
          width: sideways ? box.h : box.w,
          height: sideways ? box.w : box.h,
          transform: `translate(-50%, -50%) rotate(${rot}deg)`,
        }}
      />
      <button
        type="button"
        title="Drehen"
        onClick={onRotate}
        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card/90 text-muted-foreground hover:text-foreground"
      >
        <RotateCw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
