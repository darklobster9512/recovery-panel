import { describe, it, expect } from "vitest";
import { sanitizeSender, parseSevenResponse } from "../../supabase/functions/_shared/sevenio";

describe("seven.io", () => {
  it("removes & and spaces from sender, max 11 chars", () => {
    expect(sanitizeSender("Kanzlei B&P")).toBe("KanzleiBP");
    expect(sanitizeSender("Korte & Partner Kanzlei")).toBe("KortePartne");
  });
  it("treats only code 100 as success", () => {
    expect(parseSevenResponse(true, "100").ok).toBe(true);
    expect(parseSevenResponse(true, '{"success":"100"}').ok).toBe(true);
    expect(parseSevenResponse(true, "500")).toMatchObject({ ok: false, error: "Zu wenig Guthaben" });
    expect(parseSevenResponse(true, "201").ok).toBe(false);
  });
});
