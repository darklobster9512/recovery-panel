import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Calendar as CalendarIcon, Clock, CheckCircle2, X, RefreshCw } from "lucide-react";
import {
  BookingSettings, DEFAULT_BOOKING_SETTINGS, generateTimeSlots, isAfterLeadTime,
  toDateKey, formatDateLong, formatTime,
} from "@/lib/booking";
import { fetchAppSettings } from "@/lib/settings";
import { notifyTelegram } from "@/lib/telegramNotify";
import { isBefore, startOfDay } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [booked, setBooked] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);
  const [isRebooking, setIsRebooking] = useState(false);

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
    if (!selectedDate) { setBooked(new Set()); setSelectedTime(null); return; }
    loadBookedForDay(selectedDate);
    setSelectedTime(null);
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
    for (const r of data ?? []) s.add(String(r.appointment_time).slice(0, 5));
    setBooked(s);
  }

  const slots = useMemo(() => {
    if (!selectedDate) return [];
    return generateTimeSlots(
      settings.booking_start_time?.slice(0, 5) ?? "09:00",
      settings.booking_end_time?.slice(0, 5) ?? "17:00",
      settings.booking_interval_minutes ?? 30,
    );
  }, [selectedDate, settings]);

  async function book() {
    if (!user?.id || !selectedDate || !selectedTime) return;
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
        appointment_time: `${selectedTime}:00`,
        status: "gebucht",
        created_by: user.id,
      };
      const { data, error } = await supabase.from("appointments").insert(insert as any).select("id, appointment_date, appointment_time, status, caller_id").single();
      if (error) throw error;
      setActive(data as any);
      toast({ title: "Termin gebucht", description: `${formatDateLong(toDateKey(selectedDate))} um ${selectedTime} Uhr` });
      notifyTelegram("appointment_booked" as any, {
        vic_id: user.id,
        contact_name: contactName,
        appointment_date: toDateKey(selectedDate),
        appointment_time: selectedTime,
      });
      setSelectedDate(undefined);
      setSelectedTime(null);
      setIsRebooking(false);
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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center md:text-left">
        <h2 className="font-serif text-2xl text-[#0b1f3a]">Telefontermin buchen</h2>
        <p className="mt-1 text-sm text-slate-600">
          Vereinbaren Sie einen persönlichen Rückruf mit {contactName}.
        </p>
      </div>

      {active && !isRebooking && (
        <div className="rounded-xl border border-[#0b1f3a]/10 bg-white shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0b1f3a]">Ihr aktueller Termin</p>
              <p className="text-sm text-slate-600">
                {formatDateLong(active.appointment_date)} um {formatTime(active.appointment_time)} Uhr
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <Button variant="outline" onClick={() => setIsRebooking(true)} disabled={saving} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Umbuchen
            </Button>
            <Button variant="outline" onClick={cancel} disabled={saving} className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
              <X className="w-4 h-4" /> Absagen
            </Button>
          </div>
        </div>
      )}

      {isRebooking && (
        <div className="rounded-xl border border-[#0b1f3a]/10 bg-white shadow-sm p-4 flex items-center justify-between">
          <p className="text-sm text-slate-600">Wählen Sie unten einen neuen Termin aus.</p>
          <Button variant="ghost" size="sm" onClick={() => setIsRebooking(false)}>Abbrechen</Button>
        </div>
      )}

      <Card className="overflow-hidden border border-slate-200 shadow-sm rounded-xl">
        <div className="h-1.5 bg-gradient-to-r from-[#0b1f3a] to-[#c9a24a]" />
        <CardHeader className="border-b border-slate-200/60 bg-white">
          <CardTitle className="font-serif text-xl text-[#0b1f3a]">
            {isRebooking ? "Termin umbuchen" : "Termin buchen"}
          </CardTitle>
        </CardHeader>

        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200/60">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="h-4 w-4 text-[#c9a24a]" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Datum</p>
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
              className="pointer-events-auto mx-auto"
              classNames={{
                day_selected: "bg-[#0b1f3a] text-white hover:bg-[#0b1f3a] hover:text-white focus:bg-[#0b1f3a] focus:text-white",
              }}
            />
          </CardContent>

          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-[#c9a24a]" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Uhrzeit</p>
            </div>
            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center mb-3">
                  <CalendarIcon className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">Bitte wählen Sie zuerst ein Datum.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[340px] overflow-y-auto pr-1 brand-scrollbar">
                {slots.map((t) => {
                  const disabled = booked.has(t) || !isAfterLeadTime(selectedDate, t, settings.booking_lead_hours);
                  const isSelected = selectedTime === t;
                  return (
                    <button
                      key={t}
                      disabled={disabled || saving}
                      onClick={() => setSelectedTime(t)}
                      className={cn(
                        "h-10 rounded-lg border text-sm font-medium transition-all duration-200",
                        disabled
                          ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                          : isSelected
                          ? "border-[#0b1f3a] bg-[#0b1f3a] text-white shadow-md"
                          : "border-slate-200 bg-white text-[#0b1f3a] hover:border-[#0b1f3a]/40 hover:shadow-sm"
                      )}
                    >{t}</button>
                  );
                })}
                {slots.length === 0 && (
                  <p className="col-span-full text-sm text-slate-500 py-8 text-center">Keine verfügbaren Zeiten.</p>
                )}
              </div>
            )}
          </CardContent>
        </div>

        {selectedDate && selectedTime && (
          <div className="border-t border-slate-200/60 p-6 bg-white">
            <Button
              className="w-full bg-[#0b1f3a] hover:bg-[#0b1f3a]/90 text-white h-12 text-sm font-semibold"
              onClick={book}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Wird gebucht…
                </>
              ) : (
                `${isRebooking ? "Termin umbuchen" : "Termin buchen"}: ${formatDateLong(toDateKey(selectedDate))} um ${selectedTime} Uhr`
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
