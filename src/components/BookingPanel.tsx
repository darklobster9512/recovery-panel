import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, CheckCircle2, X } from "lucide-react";
import {
  BookingSettings, DEFAULT_BOOKING_SETTINGS, generateTimeSlots, isAfterLeadTime,
  isBookableDay, toDateKey, formatDateLong, isoWeekday, formatTime,
} from "@/lib/booking";
import { fetchAppSettings } from "@/lib/settings";
import { notifyTelegram } from "@/lib/telegramNotify";

interface CallerInfo {
  first_name: string | null;
  last_name: string | null;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  caller_id: string | null;
}

export default function BookingPanel({
  callerId,
  callerInfo,
}: {
  callerId: string | null;
  callerInfo: CallerInfo | null;
}) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BookingSettings>(DEFAULT_BOOKING_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [booked, setBooked] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);

  const contactName = callerInfo
    ? [callerInfo.first_name, callerInfo.last_name].filter(Boolean).join(" ") || "Ihrem Ansprechpartner"
    : "Dr. Thomas Korte";

  useEffect(() => {
    (async () => {
      try {
        const s = await fetchAppSettings();
        setSettings({
          booking_start_time: s.booking_start_time ?? DEFAULT_BOOKING_SETTINGS.booking_start_time,
          booking_end_time: s.booking_end_time ?? DEFAULT_BOOKING_SETTINGS.booking_end_time,
          booking_interval_minutes: s.booking_interval_minutes ?? DEFAULT_BOOKING_SETTINGS.booking_interval_minutes,
          booking_weekdays: s.booking_weekdays ?? DEFAULT_BOOKING_SETTINGS.booking_weekdays,
          booking_lead_hours: s.booking_lead_hours ?? DEFAULT_BOOKING_SETTINGS.booking_lead_hours,
        });
      } catch {/* keep defaults */}
      await loadActive();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!selectedDate) { setBooked(new Set()); return; }
    loadBookedForDay(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, callerId]);

  async function loadActive() {
    if (!user?.id) return;
    const { data } = await supabase
      .from("appointments")
      .select("id, appointment_date, appointment_time, status, caller_id")
      .eq("vic_id", user.id)
      .eq("status", "gebucht")
      .order("appointment_date", { ascending: true })
      .limit(1)
      .maybeSingle();
    setActive((data as any) ?? null);
  }

  async function loadBookedForDay(day: Date) {
    const key = toDateKey(day);
    const { data, error } = await (supabase as any).rpc("booked_slots_for_caller", {
      _caller_id: callerId, _from: key, _to: key,
    });
    if (error) { setBooked(new Set()); return; }
    const s = new Set<string>();
    for (const r of data ?? []) s.add(String(r.appointment_time).slice(0,5));
    setBooked(s);
  }

  const monthDays = useMemo(() => {
    const first = new Date(monthCursor);
    const startPad = (isoWeekday(first) - 1);
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(first.getFullYear(), first.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [monthCursor]);

  const slots = useMemo(() => {
    if (!selectedDate) return [];
    return generateTimeSlots(
      settings.booking_start_time?.slice(0,5) ?? "09:00",
      settings.booking_end_time?.slice(0,5) ?? "17:00",
      settings.booking_interval_minutes ?? 30,
    );
  }, [selectedDate, settings]);

  async function book(time: string) {
    if (!user?.id || !selectedDate) return;
    setSaving(true);
    try {
      if (active) {
        const { error: delErr } = await supabase.from("appointments").delete().eq("id", active.id);
        if (delErr) throw delErr;
      }
      const insert = {
        vic_id: user.id,
        caller_id: callerId,
        appointment_date: toDateKey(selectedDate),
        appointment_time: `${time}:00`,
        status: "gebucht",
        created_by: user.id,
      };
      const { data, error } = await supabase.from("appointments").insert(insert as any).select("id, appointment_date, appointment_time, status, caller_id").single();
      if (error) throw error;
      setActive(data as any);
      toast({ title: "Termin gebucht", description: `${formatDateLong(toDateKey(selectedDate))} um ${time} Uhr` });
      notifyTelegram("appointment_booked" as any, {
        vic_id: user.id,
        contact_name: contactName,
        appointment_date: toDateKey(selectedDate),
        appointment_time: time,
      });
      setSelectedDate(null);
    } catch (e: any) {
      toast({ title: "Buchung fehlgeschlagen", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function cancel() {
    if (!active) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("appointments").update({ status: "abgesagt" }).eq("id", active.id);
      if (error) throw error;
      setActive(null);
      toast({ title: "Termin abgesagt" });
    } catch (e: any) {
      toast({ title: "Absage fehlgeschlagen", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-[#0b1f3a]">Telefontermin buchen</h2>
        <p className="mt-1 text-sm text-slate-600">
          Vereinbaren Sie einen persönlichen Rückruf mit {contactName}.
        </p>
      </div>

      {active && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 flex flex-wrap items-center gap-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-900">Ihr aktueller Termin</p>
            <p className="text-sm text-emerald-900/80">
              {formatDateLong(active.appointment_date)} um {formatTime(active.appointment_time)} Uhr
            </p>
          </div>
          <Button variant="outline" onClick={cancel} disabled={saving} className="gap-2">
            <X className="w-4 h-4" /> Absagen
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[#0b1f3a] font-semibold">
            <CalendarIcon className="w-4 h-4" />
            {monthCursor.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setMonthCursor((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setMonthCursor((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs text-center text-slate-500 mb-1">
          {["Mo","Di","Mi","Do","Fr","Sa","So"].map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((d, i) => {
            if (!d) return <div key={i} />;
            const bookable = isBookableDay(d, settings.booking_weekdays);
            const isSel = selectedDate && toDateKey(selectedDate) === toDateKey(d);
            return (
              <button key={i} disabled={!bookable}
                onClick={() => setSelectedDate(d)}
                className={`aspect-square rounded-md text-sm font-medium transition-colors ${
                  isSel ? "bg-[#0b1f3a] text-white"
                  : bookable ? "bg-slate-50 hover:bg-slate-100 text-slate-800"
                  : "text-slate-300 cursor-not-allowed"
                }`}
              >{d.getDate()}</button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-4 text-[#0b1f3a] font-semibold">
            <Clock className="w-4 h-4" />
            Verfügbare Zeiten am {formatDateLong(toDateKey(selectedDate))}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {slots.map((t) => {
              const disabled = booked.has(t) || !isAfterLeadTime(selectedDate, t, settings.booking_lead_hours);
              return (
                <button key={t} disabled={disabled || saving}
                  onClick={() => book(t)}
                  className={`h-10 rounded-md border text-sm font-medium transition-colors ${
                    disabled ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                    : "border-[#0b1f3a]/20 bg-white text-[#0b1f3a] hover:bg-[#0b1f3a] hover:text-white"
                  }`}
                >{t}</button>
              );
            })}
            {slots.length === 0 && (
              <p className="col-span-full text-sm text-slate-500">Keine Zeiten konfiguriert.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
