export interface BookingSettings {
  booking_start_time: string;
  booking_end_time: string;
  booking_interval_minutes: number;
  booking_weekdays: number[];
  booking_lead_hours: number;
}

export const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  booking_start_time: "09:00",
  booking_end_time: "17:00",
  booking_interval_minutes: 30,
  booking_weekdays: [1, 2, 3, 4, 5],
  booking_lead_hours: 2,
};

export const WEEKDAY_LABELS: { value: number; label: string }[] = [
  { value: 1, label: "Mo" },
  { value: 2, label: "Di" },
  { value: 3, label: "Mi" },
  { value: 4, label: "Do" },
  { value: 5, label: "Fr" },
  { value: 6, label: "Sa" },
  { value: 7, label: "So" },
];

/** Minutes since midnight from "HH:MM" / "HH:MM:SS". */
export function toMinutes(time: string): number {
  const [h, m] = (time || "0:0").split(":");
  return Number(h) * 60 + Number(m ?? 0);
}

export function formatTime(time: string): string {
  const [h, m] = (time || "0:0").split(":");
  return `${String(Number(h)).padStart(2, "0")}:${String(Number(m ?? 0)).padStart(2, "0")}`;
}

/** All slot start times between start and end, spaced by interval. */
export function generateTimeSlots(start: string, end: string, interval: number): string[] {
  const from = toMinutes(start);
  const to = toMinutes(end);
  const step = Math.max(5, Number(interval) || 30);
  const slots: string[] = [];
  for (let t = from; t + step <= to; t += step) {
    slots.push(
      `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`,
    );
  }
  return slots;
}

/** ISO weekday (Mon=1 … Sun=7) */
export function isoWeekday(d: Date): number {
  return d.getDay() === 0 ? 7 : d.getDay();
}

export function isBookableDay(d: Date, weekdays: number[]): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  if (day.getTime() < today.getTime()) return false;
  return (weekdays ?? []).includes(isoWeekday(day));
}

/** Slot lies far enough in the future given the configured lead time. */
export function isAfterLeadTime(date: Date, time: string, leadHours: number): boolean {
  const [h, m] = time.split(":");
  const slot = new Date(date);
  slot.setHours(Number(h), Number(m ?? 0), 0, 0);
  const earliest = new Date(Date.now() + Math.max(0, Number(leadHours) || 0) * 3600 * 1000);
  return slot.getTime() >= earliest.getTime();
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDateLong(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  gebucht: "Gebucht",
  stattgefunden: "Stattgefunden",
  nicht_erreicht: "Nicht erreicht",
  abgesagt: "Abgesagt",
};
