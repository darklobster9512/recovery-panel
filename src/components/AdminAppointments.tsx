import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRightLeft, Plus, Calendar as CalendarIcon, Clock, Check, ChevronsUpDown, X } from "lucide-react";
import { APPOINTMENT_STATUS_LABELS, BookingSettings, DEFAULT_BOOKING_SETTINGS, formatDateLong, formatTime, generateTimeSlots, toDateKey } from "@/lib/booking";
import { fetchAppSettings } from "@/lib/settings";
import { notifyTelegram } from "@/lib/telegramNotify";
import { isBefore, startOfDay } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  is_transferred: boolean;
  caller_id: string | null;
  vic_id: string;
  reason: string | null;
  created_by: string | null;
  vic?: { first_name: string | null; last_name: string | null; email: string | null } | null;
  caller?: { first_name: string | null; last_name: string | null; email: string | null } | null;
};

type VicOption = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  assigned_caller_id: string | null;
};

export default function AdminAppointments() {
  const { role, user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [vics, setVics] = useState<VicOption[]>([]);
  const [vicsLoading, setVicsLoading] = useState(false);
  const [selectedVic, setSelectedVic] = useState<VicOption | null>(null);
  const [vicPopoverOpen, setVicPopoverOpen] = useState(false);
  const [settings, setSettings] = useState<BookingSettings>(DEFAULT_BOOKING_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [booked, setBooked] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [role, user?.id]);
  useEffect(() => {
    (async () => {
      setSettingsLoading(true);
      try {
        const s = await fetchAppSettings();
        setSettings({
          booking_start_time: s.booking_start_time ?? DEFAULT_BOOKING_SETTINGS.booking_start_time,
          booking_end_time: s.booking_end_time ?? DEFAULT_BOOKING_SETTINGS.booking_end_time,
          booking_interval_minutes: s.booking_interval_minutes ?? DEFAULT_BOOKING_SETTINGS.booking_interval_minutes,
          booking_weekdays: s.booking_weekdays ?? DEFAULT_BOOKING_SETTINGS.booking_weekdays,
          booking_lead_hours: s.booking_lead_hours ?? DEFAULT_BOOKING_SETTINGS.booking_lead_hours,
        });
      } catch {
        setSettings(DEFAULT_BOOKING_SETTINGS);
      }
      setSettingsLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!dialogOpen) return;
    loadVics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen]);

  useEffect(() => {
    if (!selectedDate || !selectedVic) {
      setBooked(new Set());
      setSelectedTime(null);
      return;
    }
    const callerId = role === "caller" ? user?.id ?? null : selectedVic.assigned_caller_id;
    if (!callerId) {
      setBooked(new Set());
      setSelectedTime(null);
      return;
    }
    loadBookedForDay(selectedDate, callerId);
    setSelectedTime(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedVic]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("id, appointment_date, appointment_time, status, is_transferred, caller_id, vic_id, reason, created_by")
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });
    if (error) { toast({ title: "Fehler", description: error.message, variant: "destructive" }); setLoading(false); return; }
    const vicIds = Array.from(new Set((data ?? []).map((r) => r.vic_id)));
    const callerIds = Array.from(new Set((data ?? []).map((r) => r.caller_id).filter(Boolean) as string[]));
    const [vics, callers] = await Promise.all([
      vicIds.length ? supabase.from("profiles").select("id, first_name, last_name, email").in("id", vicIds) : Promise.resolve({ data: [] as any[] }),
      callerIds.length ? supabase.from("profiles").select("id, first_name, last_name, email").in("id", callerIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const vicMap = new Map<string, any>((vics.data ?? []).map((p: any) => [p.id, p]));
    const callerMap = new Map<string, any>((callers.data ?? []).map((p: any) => [p.id, p]));
    setRows(((data ?? []) as any[]).map((r) => ({ ...r, vic: vicMap.get(r.vic_id) ?? null, caller: r.caller_id ? callerMap.get(r.caller_id) ?? null : null })));
    setLoading(false);
  }

  async function loadVics() {
    if (!user?.id) return;
    setVicsLoading(true);
    let query = supabase.from("profiles").select("id, first_name, last_name, email, assigned_caller_id").order("created_at", { ascending: false });
    if (role === "caller") {
      query = query.eq("assigned_caller_id", user.id);
    }
    const { data, error } = await query;
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      setVicsLoading(false);
      return;
    }
    setVics((data ?? []) as VicOption[]);
    setVicsLoading(false);
  }

  async function loadBookedForDay(day: Date, callerId: string) {
    const key = toDateKey(day);
    const { data, error } = await (supabase as any).rpc("booked_slots_for_caller", {
      _caller_id: callerId, _from: key, _to: key,
    });
    if (error) { setBooked(new Set()); return; }
    const s = new Set<string>();
    for (const r of data ?? []) s.add(String(r.appointment_time).slice(0, 5));
    setBooked(s);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      const parts = [r.vic?.first_name, r.vic?.last_name, r.vic?.email, r.caller?.first_name, r.caller?.last_name, r.reason].filter(Boolean).join(" ").toLowerCase();
      return parts.includes(q);
    });
  }, [rows, statusFilter, search]);

  const slots = useMemo(() => {
    if (!selectedDate) return [];
    return generateTimeSlots(
      settings.booking_start_time?.slice(0, 5) ?? "09:00",
      settings.booking_end_time?.slice(0, 5) ?? "17:00",
      settings.booking_interval_minutes ?? 30,
    );
  }, [selectedDate, settings]);

  const selectedVicLabel = useMemo(() => {
    if (!selectedVic) return "";
    return [selectedVic.first_name, selectedVic.last_name].filter(Boolean).join(" ") || selectedVic.email || selectedVic.id;
  }, [selectedVic]);

  function resetDialog() {
    setSelectedVic(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setBooked(new Set());
    setReason("");
    setVicPopoverOpen(false);
  }

  async function handleSave() {
    if (!user?.id || !selectedVic || !selectedDate || !selectedTime) return;
    const callerId = role === "caller" ? user.id : selectedVic.assigned_caller_id ?? null;
    setSaving(true);
    try {
      const insert = {
        vic_id: selectedVic.id,
        caller_id: callerId,
        appointment_date: toDateKey(selectedDate),
        appointment_time: `${selectedTime}:00`,
        status: "gebucht",
        reason: reason.trim() || null,
        created_by: user.id,
      };
      const { data, error } = await supabase.from("appointments").insert(insert as any).select("id, appointment_date, appointment_time, status, caller_id, vic_id, reason, created_by").single();
      if (error) throw error;
      toast({ title: "Termin gespeichert", description: `${formatDateLong(toDateKey(selectedDate))} um ${selectedTime} Uhr` });
      notifyTelegram("appointment_booked", {
        vic_id: selectedVic.id,
        contact_name: role === "caller" ? "Ihr Caller" : "Kanzlei",
        appointment_date: toDateKey(selectedDate),
        appointment_time: selectedTime,
      });
      setRows((prev) => [data as Row, ...prev]);
      resetDialog();
      setDialogOpen(false);
    } catch (e: any) {
      toast({ title: "Speichern fehlgeschlagen", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return toast({ title: "Fehler", description: error.message, variant: "destructive" });
    setRows((r) => r.map((x) => x.id === id ? { ...x, status } : x));
  }

  const isAdmin = role === "admin";
  const canAdd = role === "admin" || role === "caller";

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <p className="mb-2 text-xs font-bold uppercase text-primary" style={{ letterSpacing: "0.08em" }}>Vertrieb</p>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">Termine</h2>
            <p className="mt-2 text-sm text-muted-foreground">Alle Telefontermine der Vics.</p>
          </div>
          {canAdd && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Termin hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Termin hinzufügen</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-2">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Vic</Label>
                    <Popover open={vicPopoverOpen} onOpenChange={setVicPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={vicPopoverOpen}
                          className="w-full justify-between font-normal h-10"
                          disabled={vicsLoading || settingsLoading}
                        >
                          <span className={cn(!selectedVic && "text-muted-foreground")}>
                            {selectedVic ? selectedVicLabel : (vicsLoading ? "Lädt…" : "Vic auswählen")}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                        <Command>
                          <CommandInput placeholder="Vic suchen…" />
                          <CommandList>
                            <CommandEmpty>{vicsLoading ? "Lädt…" : "Kein Vic gefunden"}</CommandEmpty>
                            <CommandGroup>
                              {vics.map((v) => {
                                const label = [v.first_name, v.last_name].filter(Boolean).join(" ") || v.email || v.id;
                                return (
                                  <CommandItem
                                    key={v.id}
                                    value={`${label} ${v.email ?? ""} ${v.id}`}
                                    onSelect={() => {
                                      setSelectedVic(v);
                                      setVicPopoverOpen(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", selectedVic?.id === v.id ? "opacity-100" : "opacity-0")} />
                                    {label}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {vics.length === 0 && !vicsLoading && role === "caller" && (
                      <p className="text-xs text-muted-foreground">Ihnen sind aktuell keine Vics zugewiesen.</p>
                    )}
                  </div>

                  {selectedVic && isAdmin && !selectedVic.assigned_caller_id && (
                    <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                      Diesem Vic ist kein Caller zugewiesen. Der Termin wird ohne Caller-Referenz gespeichert.
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        <Label className="text-[11px] font-bold uppercase text-muted-foreground">Datum</Label>
                      </div>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(d) => {
                          setSelectedDate(d);
                          setSelectedTime(null);
                        }}
                        disabled={(date) => {
                          const dow = date.getDay();
                          const isoDay = dow === 0 ? 7 : dow;
                          return !settings.booking_weekdays.includes(isoDay) || isBefore(date, startOfDay(new Date()));
                        }}
                        locale={de}
                        className="pointer-events-auto mx-auto rounded-md border border-border"
                        classNames={{
                          day_selected: "bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white",
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <Label className="text-[11px] font-bold uppercase text-muted-foreground">Uhrzeit</Label>
                      </div>
                      {!selectedDate ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center rounded-md border border-border">
                          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground">Bitte wählen Sie zuerst ein Datum.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[340px] overflow-y-auto pr-1 brand-scrollbar">
                          {slots.map((t) => {
                            const disabled = booked.has(t);
                            const isSelected = selectedTime === t;
                            return (
                              <button
                                key={t}
                                disabled={disabled || saving}
                                onClick={() => setSelectedTime(t)}
                                className={cn(
                                  "h-10 rounded-lg border text-sm font-medium transition-all duration-200",
                                  disabled
                                    ? "border-muted bg-muted/40 text-muted-foreground/60 cursor-not-allowed line-through"
                                    : isSelected
                                    ? "border-primary bg-primary text-white shadow-md"
                                    : "border-border bg-card text-foreground hover:border-primary/40 hover:shadow-sm"
                                )}
                              >{t}</button>
                            );
                          })}
                          {slots.length === 0 && (
                            <p className="col-span-full text-sm text-muted-foreground py-8 text-center">Keine verfügbaren Zeiten.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reason" className="text-[11px] font-bold uppercase text-muted-foreground">Grund für Termin</Label>
                    <Textarea
                      id="reason"
                      placeholder="Optional: Notiz zum Gesprächsthema"
                      value={reason}
                      onChange={(e) => setReason(e.target.value.slice(0, 500))}
                      rows={3}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right">{reason.length}/500</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { resetDialog(); setDialogOpen(false); }} disabled={saving}>
                    <X className="w-4 h-4 mr-2" /> Abbrechen
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!selectedVic || !selectedDate || !selectedTime || saving}
                    className="gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Termin speichern
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      <Card>
        <CardHeader className="border-b border-border px-5 py-4">
          <CardTitle className="text-base">Buchungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-wrap gap-3">
            <Input placeholder="Vic, Caller oder Grund suchen" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                {Object.entries(APPOINTMENT_STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Keine Termine gefunden.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                    <th className="py-2 pr-4">Datum</th>
                    <th className="py-2 pr-4">Zeit</th>
                    <th className="py-2 pr-4">Vic</th>
                    <th className="py-2 pr-4">Caller</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Grund</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-2 pr-4">{formatDateLong(r.appointment_date)}</td>
                      <td className="py-2 pr-4">{formatTime(r.appointment_time)}</td>
                      <td className="py-2 pr-4">
                        <div className="font-medium">{[r.vic?.first_name, r.vic?.last_name].filter(Boolean).join(" ") || "—"}</div>
                        <div className="text-xs text-muted-foreground">{r.vic?.email}</div>
                      </td>
                      <td className="py-2 pr-4">
                        {r.caller ? [r.caller.first_name, r.caller.last_name].filter(Boolean).join(" ") : <span className="text-muted-foreground">Kanzlei</span>}
                        {r.is_transferred && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-semibold">
                            <ArrowRightLeft className="w-3 h-3" /> übertragen
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        <Select value={r.status} onValueChange={(v) => setStatus(r.id, v)}>
                          <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(APPOINTMENT_STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 pr-4">
                        <div className="max-w-[200px] truncate text-muted-foreground" title={r.reason ?? undefined}>
                          {r.reason || "—"}
                        </div>
                      </td>
                      <td className="py-2 pr-4">
                        <Button variant="ghost" size="sm" onClick={() => setStatus(r.id, "abgesagt")}>Absagen</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
