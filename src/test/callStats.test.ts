import { describe, it, expect } from "vitest";
import { periodRange, fmtHM, toKey } from "@/lib/callStats";

describe("callStats", () => {
  it("week runs Monday to Sunday", () => {
    const r = periodRange("week", new Date(2026, 9, 30)); // Fri 30.10.2026
    expect(toKey(r.from)).toBe("2026-10-26");
    expect(toKey(r.to)).toBe("2026-11-01");
  });
  it("Sunday belongs to the week starting the previous Monday", () => {
    const r = periodRange("week", new Date(2026, 10, 1));
    expect(toKey(r.from)).toBe("2026-10-26");
  });
  it("previous month range", () => {
    const r = periodRange("month", new Date(2026, 2, 31), -1);
    expect(toKey(r.from)).toBe("2026-02-01");
    expect(toKey(r.to)).toBe("2026-02-28");
  });
  it("formats hh:mm", () => {
    expect(fmtHM(3725)).toBe("01:02");
    expect(fmtHM(0)).toBe("00:00");
  });
});
