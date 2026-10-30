export type Period = "day" | "week" | "month";

const pad = (n: number) => String(n).padStart(2, "0");
export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Today's date in Europe/Berlin as a local Date at midnight. */
export function berlinToday(now = new Date()): Date {
  const s = now.toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Range for period containing anchor shifted by offset periods. Week = Monday–Sunday. */
export function periodRange(period: Period, anchor: Date, offset = 0): { from: Date; to: Date } {
  const a = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  if (period === "day") {
    a.setDate(a.getDate() + offset);
    return { from: a, to: new Date(a) };
  }
  if (period === "week") {
    const dow = (a.getDay() + 6) % 7; // Monday = 0
    const from = new Date(a.getFullYear(), a.getMonth(), a.getDate() - dow + offset * 7);
    const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6);
    return { from, to };
  }
  const from = new Date(a.getFullYear(), a.getMonth() + offset, 1);
  const to = new Date(from.getFullYear(), from.getMonth() + 1, 0);
  return { from, to };
}

export function fmtHM(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}`;
}

export function fmtMS(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

export function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - y.getTime()) / 86400000 + 1) / 7);
}
